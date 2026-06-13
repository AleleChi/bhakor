import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma.service';
import { REQUIRE_PERMISSION_KEY } from './permission.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRE_PERMISSION_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication credentials missing. Ensure JwtGuard is applied.');
    }

    // SUPER_ADMIN has full sovereign authority and bypasses all guard restrictions
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    // Retrieve user session or role from database for live permission mapping
    const roleRecord = await this.prisma.role.findUnique({
      where: { name: user.role },
      include: {
        rolePermissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!roleRecord) {
      throw new ForbiddenException(`Access denied. Role ${user.role} does not exist in local IAM directory.`);
    }

    // Map permissions case-insensitively for complete robust verification
    const userPermissionMap = new Set(
      roleRecord.rolePermissions.map(rp => rp.permission.action.toUpperCase())
    );

    // Verify if all required permissions are satisfied
    const hasPermission = requiredPermissions.every(perm => 
      userPermissionMap.has(perm.toUpperCase()) || 
      userPermissionMap.has(perm.replace('_', '.').toUpperCase()) // Support backward compatible dot notations
    );

    if (!hasPermission) {
      throw new ForbiddenException(`Access denied. Insufficient administrative permissions to access this endpoint.`);
    }

    return true;
  }
}

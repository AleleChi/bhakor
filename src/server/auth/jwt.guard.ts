import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { EnterpriseLogger } from '../services/logger.service';

function parseBrowser(ua: string): string {
  if (!ua) return 'Web Client';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Chrome') && !ua.includes('Chromium') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome') && !ua.includes('Chromium')) return 'Safari';
  if (ua.includes('Edg') || ua.includes('Edge')) return 'Edge';
  return 'Web App Portal';
}

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication token missing.');
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = this.jwtService.verify(token, { secret: 'OOMS_SUPER_SECRET_KEY' });
      request.user = payload;
      request.token = token;

      // Check stateful session in Database
      let session = await this.prisma.userSession.findUnique({
        where: { token },
        include: { user: true },
      });

      // Role active status check
      const userRole = session ? session.user.role : payload.role;
      const roleRecord = await this.prisma.role.findUnique({
        where: { name: userRole }
      });
      if (roleRecord && !roleRecord.isActive) {
        throw new ForbiddenException('The administrative role associated with this account has been deactivated.');
      }

      if (!session) {
        // Fallback safety to allow seamless logins for newly seeded/bootstrapped users who do not yet have a record
        const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
        if (user) {
          if (!user.deletedAt && user.status === 'ACTIVE') {
            const userAgent = request.headers['user-agent'] || 'Web Console Session';
            // Auto-generate session mapping for comfort
            session = await this.prisma.userSession.create({
              data: {
                token,
                userId: user.id,
                device: userAgent,
                browser: parseBrowser(userAgent),
                ip: request.ip || '127.0.0.1',
                location: 'Abuja, Nigeria',
                lastActivity: new Date(),
              },
              include: { user: true }
            });
            EnterpriseLogger.info('AUTH', `SESSION_RECOVERED: Created session record dynamically for user [${user.email}] from valid token.`);
          } else {
            EnterpriseLogger.warn('AUTH', `SESSION_NOT_FOUND: Session record not found. User [${user.email}] status is ${user.status} or deleted.`);
            throw new UnauthorizedException('Active session not found in registry (revoked/expired).');
          }
        } else {
          // JWT is valid but user (and session) not found (stale token recovery)
          EnterpriseLogger.warn('AUTH', `SESSION_NOT_FOUND: Valid token references non-existent user ID [${payload.sub}] (stale/migrated user).`);
          throw new UnauthorizedException('Session expired. Please login again.');
        }
      }

      if (session.user.deletedAt) {
        EnterpriseLogger.warn('AUTH', `SESSION_NOT_FOUND: User session referencing soft-deleted user.`);
        throw new UnauthorizedException('This personnel account has been deleted.');
      }

      if (session.user.status !== 'ACTIVE') {
        EnterpriseLogger.warn('AUTH', `SESSION_NOT_FOUND: User session referencing non-active user.`);
        throw new UnauthorizedException(`Account access locked. State: ${session.user.status}`);
      }

      if (session.user.lockoutEnd && new Date() < new Date(session.user.lockoutEnd)) {
        EnterpriseLogger.warn('AUTH', `SESSION_NOT_FOUND: User session is locked out.`);
        throw new UnauthorizedException('Personnel account currently locked due to brute force mitigation.');
      }

      // Live Session Governance: Update session tracking and activity timestamp
      await this.prisma.userSession.update({
        where: { id: session.id },
        data: {
          lastActivity: new Date(),
          browser: session.browser || parseBrowser(request.headers['user-agent'] || ''),
          location: session.location || 'Abuja, Nigeria'
        },
      });

      return true;
    } catch (err: any) {
      if (err instanceof ForbiddenException || err instanceof UnauthorizedException) {
        throw err;
      }
      EnterpriseLogger.error('AUTH', `AUTH_FAILURE: Token verification failed in pipeline. Error: ${err.message}`);
      throw new UnauthorizedException(err.message || 'Invalid or expired authentication token.');
    }
  }
}

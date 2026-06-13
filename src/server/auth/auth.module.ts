import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtGuard } from './jwt.guard';
import { PermissionGuard } from './permission.guard';
import { PrismaService } from '../prisma.service';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'OOMS_SUPER_SECRET_KEY',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtGuard, PermissionGuard, PrismaService],
  exports: [AuthService, JwtModule, JwtGuard, PermissionGuard],
})
export class AuthModule {}

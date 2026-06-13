import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { RegistryModule } from './registry/registry.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaService } from './prisma.service';
import { NotFoundExceptionFilter } from './not-found.filter';
import { HealthController } from './health/health.controller';

@Module({
  imports: [AuthModule, DashboardModule, RegistryModule, NotificationsModule],
  controllers: [HealthController],
  providers: [
    PrismaService,
    {
      provide: APP_FILTER,
      useClass: NotFoundExceptionFilter,
    },
  ],
  exports: [PrismaService],
})
export class AppModule {}


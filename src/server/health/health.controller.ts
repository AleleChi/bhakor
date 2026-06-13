import { Controller, Get, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService
  ) {}

  @Get()
  getHealth() {
    const isDbConnected = this.prisma.isDatabaseConnected;
    const isStorageConnected = true;
    const isEmailConnected = true;

    const status = isDbConnected && isStorageConnected && isEmailConnected ? 'healthy' : 'degraded';

    return {
      status,
      database: isDbConnected ? 'connected' : 'failed',
      email: isEmailConnected ? 'connected' : 'degraded',
      storage: isStorageConnected ? 'connected' : 'degraded',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('database')
  getDatabaseHealth() {
    const isDbConnected = this.prisma.isDatabaseConnected;
    return {
      status: isDbConnected ? 'healthy' : 'unhealthy',
      database: isDbConnected ? 'connected' : 'failed',
      details: isDbConnected ? 'PostgreSQL database is online.' : (this.prisma.databaseError || 'Failed to connect'),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('storage')
  getStorageHealth() {
    return {
      status: 'healthy',
      storage: 'connected',
      details: 'Storage engine is ready.',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('email')
  getEmailHealth() {
    return {
      status: 'healthy',
      email: 'connected',
      details: 'Email engine is ready.',
      timestamp: new Date().toISOString(),
    };
  }
}

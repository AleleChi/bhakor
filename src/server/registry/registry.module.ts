import { Module } from '@nestjs/common';
import { RegistryController } from './registry.controller';
import { RegistryService } from './registry.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [RegistryController],
  providers: [RegistryService, PrismaService],
  exports: [RegistryService],
})
export class RegistryModule {}

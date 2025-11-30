// maintenance-summary.module.ts
import { Module } from '@nestjs/common';
import { MaintenanceSummaryController } from './controller/maintenance-summary.controller';
import { MaintenanceSummaryService } from './service/maintenance-summary.service';
import { MaintenanceSummaryRepository } from './repository/maintenance-summary.repository';
import { DatabaseModule } from '../infrastructure/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [MaintenanceSummaryController],
  providers: [MaintenanceSummaryService, MaintenanceSummaryRepository],
  exports: [MaintenanceSummaryService],
})
export class MaintenanceSummaryModule {}
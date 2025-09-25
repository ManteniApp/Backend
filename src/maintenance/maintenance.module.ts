import { Module } from '@nestjs/common';
import { MaintenanceController } from './controller/maintenance.controller';
import { MaintenanceService } from './service/maintenance.service';

@Module({
  controllers: [MaintenanceController],
  providers: [MaintenanceService]
})
export class MaintenanceModule {}

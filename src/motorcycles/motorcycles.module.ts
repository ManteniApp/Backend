/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { MotorcyclesController } from './controller/motorcycles.controller';
import { MotorcycleSpecsController } from './controller/motorcycle-specs.controller';
import { MotorcyclesService } from './service/motorcycles.service';
import { MotorcyclesRepository } from '../motorcycles/repository/motorcycles.repository'; 
import { MotorcycleSpecsService } from './service/motorcycle-specs.service';
import { MotorcycleImageScraperService } from './service/scraping.service';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { MotorcycleSpecsRepository } from './repository/motorcycle-specs.repository';
@Module({
  imports: [DatabaseModule],
  controllers: [MotorcyclesController, MotorcycleSpecsController],
  providers: [MotorcyclesService, MotorcyclesRepository, MotorcycleSpecsRepository, MotorcycleSpecsService, MotorcycleImageScraperService], 
  exports: [MotorcyclesService],
})
export class MotorcyclesModule {}

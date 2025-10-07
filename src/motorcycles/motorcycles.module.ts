import { Module } from '@nestjs/common';
import { MotorcyclesController } from './controller/motorcycles.controller';
import { MotorcyclesService } from './service/motorcycles.service';
import { MotorcyclesRepository } from '../motorcycles/repository/motorcycles.repository'; 
import { DatabaseModule } from '../infrastructure/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [MotorcyclesController],
  providers: [MotorcyclesService, MotorcyclesRepository], 
  exports: [MotorcyclesService],
})
export class MotorcyclesModule {}

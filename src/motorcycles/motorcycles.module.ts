import { Module } from '@nestjs/common';
import { MotorcyclesController } from './controller/motorcycles.controller';
import { MotorcyclesService } from './service/motorcycles.service';

@Module({
  controllers: [MotorcyclesController],
  providers: [MotorcyclesService]
})
export class MotorcyclesModule {}

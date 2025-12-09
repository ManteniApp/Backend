/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { SavingsController } from './controller/savings.controller';
import { SavingsService } from './service/savings.service';
import { SavingsRepository } from './repository/savings.repository';
import { DatabaseModule } from '../infrastructure/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [SavingsController],
  providers: [SavingsService, SavingsRepository],
  exports: [SavingsService],
})
export class SavingsModule {}
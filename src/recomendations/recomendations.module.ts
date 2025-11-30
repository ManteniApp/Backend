// recommendations.module.ts
import { Module } from '@nestjs/common';

import { DatabaseModule } from '../infrastructure/database/database.module';
import { RecommendationsController } from './controller/recomendations.controller';
import { RecommendationsService } from './service/recomendations.service';
import { RecommendationsRepository } from './repository/recomendations.repository';

@Module({
  imports: [DatabaseModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService, RecommendationsRepository],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}
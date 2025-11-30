// recommendations.controller.ts
import { Controller, Get, UseGuards, Param, Query, } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RecommendationsService, RecommendationResponse } from '../service/recomendations.service';

@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll(): Promise<{ 
    technical: RecommendationResponse[], 
    general: RecommendationResponse[],
    safety: RecommendationResponse[],
    performance: RecommendationResponse[] 
  }> {
    return this.recommendationsService.getAllRecommendations();
  }

  @UseGuards(JwtAuthGuard)
  @Get('technical')
  async getTechnical(): Promise<RecommendationResponse[]> {
    return this.recommendationsService.getTechnicalRecommendations();
  }

  @UseGuards(JwtAuthGuard)
  @Get('general')
  async getGeneral(): Promise<RecommendationResponse[]> {
    return this.recommendationsService.getGeneralRecommendations();
  }

  @UseGuards(JwtAuthGuard)
  @Get('safety')
  async getSafety(): Promise<RecommendationResponse[]> {
    return this.recommendationsService.getSafetyRecommendations();
  }

  @UseGuards(JwtAuthGuard)
  @Get('performance')
  async getPerformance(): Promise<RecommendationResponse[]> {
    return this.recommendationsService.getPerformanceRecommendations();
  }

  @UseGuards(JwtAuthGuard)
  @Get('technical/:type')
  async getTechnicalByType(@Param('type') type: string): Promise<RecommendationResponse[]> {
    return this.recommendationsService.getTechnicalRecommendationsByType(type);
  }

  @UseGuards(JwtAuthGuard)
  @Get('category/:category')
  async getByCategory(@Param('category') category: string): Promise<RecommendationResponse[]> {
    return this.recommendationsService.getRecommendationsByCategory(category);
  }

  @UseGuards(JwtAuthGuard)
  @Get('priority/:priority')
  async getByPriority(@Param('priority') priority: string): Promise<RecommendationResponse[]> {
    return this.recommendationsService.getRecommendationsByPriority(priority);
  }

  @UseGuards(JwtAuthGuard)
  @Get('upcoming')
  async getUpcoming(@Query('currentKm') currentKm: number): Promise<RecommendationResponse[]> {
    return this.recommendationsService.getUpcomingMaintenance(+currentKm);
  }

  @UseGuards(JwtAuthGuard)
  @Get('maintenance-type/:type')
  async getByMaintenanceType(@Param('type') type: string): Promise<RecommendationResponse[]> {
    return this.recommendationsService.getRecommendationsByMaintenanceType(type);
  }
}
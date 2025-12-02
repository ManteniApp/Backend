// recommendations.service.ts
import { Injectable } from '@nestjs/common';
import { RecommendationsRepository, Recommendation } from '../repository/recomendations.repository';

export interface RecommendationResponse extends Recommendation {}

@Injectable()
export class RecommendationsService {
  constructor(private readonly recommendationsRepo: RecommendationsRepository) {}

  async getAllRecommendations(): Promise<{ 
    technical: RecommendationResponse[], 
    general: RecommendationResponse[],
    safety: RecommendationResponse[],
    performance: RecommendationResponse[] 
  }> {
    return this.recommendationsRepo.findAll();
  }

  async getTechnicalRecommendations(): Promise<RecommendationResponse[]> {
    return this.recommendationsRepo.findTechnical();
  }

  async getGeneralRecommendations(): Promise<RecommendationResponse[]> {
    return this.recommendationsRepo.findGeneral();
  }

  async getSafetyRecommendations(): Promise<RecommendationResponse[]> {
    return this.recommendationsRepo.findSafety();
  }

  async getPerformanceRecommendations(): Promise<RecommendationResponse[]> {
    return this.recommendationsRepo.findPerformance();
  }

  async getTechnicalRecommendationsByType(type: string): Promise<RecommendationResponse[]> {
    return this.recommendationsRepo.findTechnicalByType(type);
  }

  async getRecommendationsByCategory(category: string): Promise<RecommendationResponse[]> {
    return this.recommendationsRepo.findByCategory(category);
  }

  async getRecommendationsByPriority(priority: string): Promise<RecommendationResponse[]> {
    return this.recommendationsRepo.findByPriority(priority);
  }

  async getUpcomingMaintenance(currentKm: number): Promise<RecommendationResponse[]> {
    return this.recommendationsRepo.findUpcomingMaintenance(currentKm);
  }

  async getRecommendationsByMaintenanceType(maintenanceType: string): Promise<RecommendationResponse[]> {
    return this.recommendationsRepo.findByMaintenanceType(maintenanceType);
  }
}
// recommendations.repository.ts
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service';

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  type: 'technical' | 'general' | 'safety' | 'performance';
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  frequency?: string;
  km_interval?: number;
  time_interval?: string;
  created_at: Date;
}

@Injectable()
export class RecommendationsRepository {
  private readonly logger = new Logger(RecommendationsRepository.name);

  constructor(private readonly db: DatabaseService) {}

  private readonly fixedRecommendations: Recommendation[] = [
    // RECOMENDACIONES TÉCNICAS - MANTENIMIENTO
    {
      id: 'MOTO-TECH-001',
      title: 'Cambio de aceite del motor',
      description: 'Reemplazar el aceite y filtro de aceite según intervalo recomendado por el fabricante',
      type: 'technical',
      category: 'engine-maintenance',
      priority: 'high',
      frequency: 'Cada 3,000-6,000 km o 6 meses',
      km_interval: 5000,
      time_interval: '6 meses',
      created_at: new Date()
    },
    {
      id: 'MOTO-TECH-002',
      title: 'Ajuste y lubricación de cadena',
      description: 'Verificar tensión de cadena y lubricar para evitar desgaste prematuro',
      type: 'technical',
      category: 'chain-maintenance',
      priority: 'medium',
      frequency: 'Cada 500 km o después de lluvia',
      km_interval: 500,
      created_at: new Date()
    },
    {
      id: 'MOTO-TECH-003',
      title: 'Revisión de frenos',
      description: 'Verificar nivel de líquido de frenos, desgaste de pastillas y estado de discos',
      type: 'technical',
      category: 'brake-system',
      priority: 'high',
      frequency: 'Cada 5,000 km o 6 meses',
      km_interval: 5000,
      time_interval: '6 meses',
      created_at: new Date()
    },
    {
      id: 'MOTO-TECH-004',
      title: 'Calibración de neumáticos',
      description: 'Verificar presión de llantas según especificaciones del fabricante',
      type: 'technical',
      category: 'tire-maintenance',
      priority: 'medium',
      frequency: 'Semanal o antes de viajes largos',
      created_at: new Date()
    },
    {
      id: 'MOTO-TECH-005',
      title: 'Limpieza de sistema de combustible',
      description: 'Limpiar inyectores y verificar filtro de combustible',
      type: 'technical',
      category: 'fuel-system',
      priority: 'medium',
      frequency: 'Cada 10,000 km',
      km_interval: 10000,
      created_at: new Date()
    },

    // RECOMENDACIONES DE SEGURIDAD
    {
      id: 'MOTO-SAFETY-001',
      title: 'Verificación de sistema eléctrico',
      description: 'Revisar luces, intermitentes, bocina y sistema de carga de batería',
      type: 'safety',
      category: 'electrical-system',
      priority: 'high',
      frequency: 'Mensual',
      created_at: new Date()
    },
    {
      id: 'MOTO-SAFETY-002',
      title: 'Inspección de suspensión',
      description: 'Verificar fugas en horquillas y amortiguador, ajustar precarga según carga',
      type: 'safety',
      category: 'suspension',
      priority: 'medium',
      frequency: 'Cada 10,000 km',
      km_interval: 10000,
      created_at: new Date()
    },
    {
      id: 'MOTO-SAFETY-003',
      title: 'Revisión de elementos de seguridad',
      description: 'Verificar estado de casco, guantes, chaqueta y equipo de protección',
      type: 'safety',
      category: 'safety-gear',
      priority: 'critical',
      frequency: 'Antes de cada viaje',
      created_at: new Date()
    },

    // RECOMENDACIONES DE RENDIMIENTO
    {
      id: 'MOTO-PERF-001',
      title: 'Sincronización de carburador/inyectores',
      description: 'Ajustar mezcla aire-combustible para óptimo rendimiento y consumo',
      type: 'performance',
      category: 'engine-tuning',
      priority: 'medium',
      frequency: 'Cada 15,000 km',
      km_interval: 15000,
      created_at: new Date()
    },
    {
      id: 'MOTO-PERF-002',
      title: 'Limpieza y ajuste de bujías',
      description: 'Limpiar, calibrar o reemplazar bujías según especificaciones',
      type: 'performance',
      category: 'ignition-system',
      priority: 'medium',
      frequency: 'Cada 8,000 km',
      km_interval: 8000,
      created_at: new Date()
    },
    {
      id: 'MOTO-PERF-003',
      title: 'Alineación y balanceo de ruedas',
      description: 'Verificar alineación del chasis y balanceo de llantas',
      type: 'performance',
      category: 'chassis',
      priority: 'low',
      frequency: 'Cada 20,000 km o después de golpes',
      km_interval: 20000,
      created_at: new Date()
    },

    // RECOMENDACIONES GENERALES
    {
      id: 'MOTO-GEN-001',
      title: 'Limpieza general de la moto',
      description: 'Limpieza completa para prevenir corrosión y mantener buen aspecto',
      type: 'general',
      category: 'cleaning',
      priority: 'low',
      frequency: 'Semanal o después de lluvia',
      created_at: new Date()
    },
    {
      id: 'MOTO-GEN-002',
      title: 'Verificación de documentación',
      description: 'Revisar vigencia de SOAT, técnico-mecánica y documentos del vehículo',
      type: 'general',
      category: 'documentation',
      priority: 'high',
      frequency: 'Anualmente',
      time_interval: '1 año',
      created_at: new Date()
    },
    {
      id: 'MOTO-GEN-003',
      title: 'Almacenamiento adecuado',
      description: 'Recomendaciones para almacenamiento prolongado (estabilizador de combustible, batería desconectada)',
      type: 'general',
      category: 'storage',
      priority: 'medium',
      created_at: new Date()
    },
    {
      id: 'MOTO-GEN-004',
      title: 'Preparación para viajes largos',
      description: 'Checklist completo antes de emprender viajes de larga distancia',
      type: 'general',
      category: 'long-trip',
      priority: 'high',
      created_at: new Date()
    },
    {
      id: 'MOTO-GEN-005',
      title: 'Cuidado en época de lluvias',
      description: 'Precauciones especiales para manejar en condiciones climáticas adversas',
      type: 'general',
      category: 'weather-conditions',
      priority: 'medium',
      created_at: new Date()
    }
  ];

  async findAll(): Promise<{ 
    technical: Recommendation[], 
    general: Recommendation[],
    safety: Recommendation[],
    performance: Recommendation[] 
  }> {
    try {
      const technical = this.fixedRecommendations.filter(rec => rec.type === 'technical');
      const general = this.fixedRecommendations.filter(rec => rec.type === 'general');
      const safety = this.fixedRecommendations.filter(rec => rec.type === 'safety');
      const performance = this.fixedRecommendations.filter(rec => rec.type === 'performance');
      
      return { technical, general, safety, performance };
    } catch (error) {
      this.logger.error('❌ Error fetching all recommendations', error);
      throw new InternalServerErrorException('Error al obtener todas las recomendaciones');
    }
  }

  async findTechnical(): Promise<Recommendation[]> {
    try {
      return this.fixedRecommendations.filter(rec => rec.type === 'technical');
    } catch (error) {
      this.logger.error('❌ Error fetching technical recommendations', error);
      throw new InternalServerErrorException('Error al obtener recomendaciones técnicas');
    }
  }

  async findGeneral(): Promise<Recommendation[]> {
    try {
      return this.fixedRecommendations.filter(rec => rec.type === 'general');
    } catch (error) {
      this.logger.error('❌ Error fetching general recommendations', error);
      throw new InternalServerErrorException('Error al obtener recomendaciones generales');
    }
  }

  async findSafety(): Promise<Recommendation[]> {
    try {
      return this.fixedRecommendations.filter(rec => rec.type === 'safety');
    } catch (error) {
      this.logger.error('❌ Error fetching safety recommendations', error);
      throw new InternalServerErrorException('Error al obtener recomendaciones de seguridad');
    }
  }

  async findPerformance(): Promise<Recommendation[]> {
    try {
      return this.fixedRecommendations.filter(rec => rec.type === 'performance');
    } catch (error) {
      this.logger.error('❌ Error fetching performance recommendations', error);
      throw new InternalServerErrorException('Error al obtener recomendaciones de rendimiento');
    }
  }

  async findByCategory(category: string): Promise<Recommendation[]> {
    try {
      return this.fixedRecommendations.filter(rec => rec.category === category);
    } catch (error) {
      this.logger.error(`❌ Error fetching recommendations by category: ${category}`, error);
      throw new InternalServerErrorException('Error al obtener recomendaciones por categoría');
    }
  }

  async findByPriority(priority: string): Promise<Recommendation[]> {
    try {
      return this.fixedRecommendations.filter(rec => rec.priority === priority);
    } catch (error) {
      this.logger.error(`❌ Error fetching recommendations by priority: ${priority}`, error);
      throw new InternalServerErrorException('Error al obtener recomendaciones por prioridad');
    }
  }

  async findUpcomingMaintenance(currentKm: number): Promise<Recommendation[]> {
    try {
      return this.fixedRecommendations.filter(rec => 
        rec.km_interval && (currentKm + 500) >= rec.km_interval
      );
    } catch (error) {
      this.logger.error(`❌ Error fetching upcoming maintenance`, error);
      throw new InternalServerErrorException('Error al obtener mantenimientos próximos');
    }
  }

  async findTechnicalByType(type: string): Promise<Recommendation[]> {
    try {
      return this.fixedRecommendations.filter(
        rec => rec.type === 'technical' && rec.category === type
      );
    } catch (error) {
      this.logger.error(`❌ Error fetching technical recommendations by type: ${type}`, error);
      throw new InternalServerErrorException('Error al obtener recomendaciones técnicas por tipo');
    }
  }

  async findById(id: string): Promise<Recommendation | null> {
    try {
      return this.fixedRecommendations.find(rec => rec.id === id) || null;
    } catch (error) {
      this.logger.error(`❌ Error fetching recommendation by ID: ${id}`, error);
      throw new InternalServerErrorException('Error al obtener la recomendación por ID');
    }
  }

  async findByMaintenanceType(maintenanceType: string): Promise<Recommendation[]> {
    try {
      const typeMap: { [key: string]: string[] } = {
        'aceite': ['engine-maintenance'],
        'frenos': ['brake-system'],
        'cadena': ['chain-maintenance'],
        'neumaticos': ['tire-maintenance'],
        'electrico': ['electrical-system'],
        'suspension': ['suspension']
      };

      const categories = typeMap[maintenanceType.toLowerCase()] || [maintenanceType];
      return this.fixedRecommendations.filter(rec => 
        categories.includes(rec.category)
      );
    } catch (error) {
      this.logger.error(`❌ Error fetching by maintenance type: ${maintenanceType}`, error);
      throw new InternalServerErrorException('Error al obtener recomendaciones por tipo de mantenimiento');
    }
  }
}
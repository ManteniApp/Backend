// maintenance-summary.repository.ts
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service';

interface SummaryFilters {
  motoId?: number;
  startDate?: Date;
  endDate?: Date;
  tipo?: string;
}

@Injectable()
export class MaintenanceSummaryRepository {
  private readonly logger = new Logger(MaintenanceSummaryRepository.name);

  constructor(private readonly db: DatabaseService) {}

  async getSummaryWithFilters(filters: SummaryFilters) {
    try {
      let query = this.db.client`
        SELECT 
          COUNT(*) as total_mantenimientos,
          COALESCE(SUM(costo), 0) as costo_total,
          COALESCE(AVG(costo), 0) as costo_promedio
        FROM mantenimientos
        WHERE 1=1
      `;

      if (filters.motoId) {
        query = this.db.client`${query} AND moto_id = ${filters.motoId}`;
      }

      if (filters.startDate) {
        query = this.db.client`${query} AND fecha >= ${filters.startDate}`;
      }

      if (filters.endDate) {
        query = this.db.client`${query} AND fecha <= ${filters.endDate}`;
      }

      if (filters.tipo) {
        query = this.db.client`${query} AND tipo = ${filters.tipo}`;
      }

      const [totals] = await query;

      // Obtener estadísticas por tipo (SCRUM-211 - Cálculos en base de datos)
      let statsQuery = this.db.client`
        SELECT 
          tipo,
          COUNT(*) as cantidad,
          COALESCE(SUM(costo), 0) as costo_total,
          COALESCE(AVG(costo), 0) as costo_promedio
        FROM mantenimientos
        WHERE 1=1
      `;

      if (filters.motoId) {
        statsQuery = this.db.client`${statsQuery} AND moto_id = ${filters.motoId}`;
      }

      if (filters.startDate) {
        statsQuery = this.db.client`${statsQuery} AND fecha >= ${filters.startDate}`;
      }

      if (filters.endDate) {
        statsQuery = this.db.client`${statsQuery} AND fecha <= ${filters.endDate}`;
      }

      if (filters.tipo) {
        statsQuery = this.db.client`${statsQuery} AND tipo = ${filters.tipo}`;
      }

      statsQuery = this.db.client`${statsQuery} GROUP BY tipo ORDER BY costo_total DESC`;

      const statsByType = await statsQuery;

      // Obtener detalles de mantenimientos
      let detailsQuery = this.db.client`
        SELECT 
          id,
          moto_id,
          fecha,
          tipo,
          descripcion,
          kilometraje,
          costo
        FROM mantenimientos
        WHERE 1=1
      `;

      if (filters.motoId) {
        detailsQuery = this.db.client`${detailsQuery} AND moto_id = ${filters.motoId}`;
      }

      if (filters.startDate) {
        detailsQuery = this.db.client`${detailsQuery} AND fecha >= ${filters.startDate}`;
      }

      if (filters.endDate) {
        detailsQuery = this.db.client`${detailsQuery} AND fecha <= ${filters.endDate}`;
      }

      if (filters.tipo) {
        detailsQuery = this.db.client`${detailsQuery} AND tipo = ${filters.tipo}`;
      }

      detailsQuery = this.db.client`${detailsQuery} ORDER BY fecha DESC`;

      const mantenimientos = await detailsQuery;

      return {
        totalMantenimientos: parseInt(totals.total_mantenimientos) || 0,
        costoTotal: parseFloat(totals.costo_total) || 0,
        costoPromedio: parseFloat(totals.costo_promedio) || 0,
        mantenimientos,
        estadisticasPorTipo: statsByType.map(stat => ({
          tipo: stat.tipo,
          cantidad: parseInt(stat.cantidad),
          costoTotal: parseFloat(stat.costo_total),
          costoPromedio: parseFloat(stat.costo_promedio),
        })),
      };
    } catch (error) {
      this.logger.error('❌ Error generating maintenance summary', error);
      throw new InternalServerErrorException('Error al generar el resumen de mantenimientos');
    }
  }
}
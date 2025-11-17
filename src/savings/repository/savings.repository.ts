/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service';

export type MaintenanceRow = {
  id: number;
  moto_id: number;
  tipo: string;  
  fecha: Date;
  kilometraje: number;
  costo: number;
};

export type MaintenanceRecommendationRow = {
  id: number;
  tipo_mantenimiento: string;
  kilometraje_recomendado: number;
  tiempo_recomendado_meses: number;
  costo_estimado: number;
  descripcion: string;
};

@Injectable()
export class SavingsRepository {
  private readonly logger = new Logger(SavingsRepository.name);

  constructor(private readonly db: DatabaseService) {}

  async getMaintenancesByMotorcycle(moto_id: number, cliente_id: number): Promise<MaintenanceRow[]> {
    try {
      const result = await this.db.query`
        SELECT 
          m.id,
          m.moto_id,
          m.fecha,
          m.tipo,  -- 👈 CORREGIDO: usar el nombre real de la columna
          m.descripcion,
          m.kilometraje,
          m.costo
        FROM mantenimientos m
        INNER JOIN motos mo ON m.moto_id = mo.id
        WHERE m.moto_id = ${moto_id} 
          AND mo.cliente_id = ${cliente_id}
          AND m.kilometraje IS NOT NULL
        ORDER BY m.fecha DESC
      `;
      
      this.logger.log(`✅ Obtenidos ${result.length} mantenimientos para moto ${moto_id}`);
      return result;
    } catch (error) {
      this.logger.error('❌ Error al obtener mantenimientos:', error);
      throw error;
    }
  }

  async getMaintenanceRecommendations(): Promise<MaintenanceRecommendationRow[]> {
    try {
      const result = await this.db.query`
        SELECT * FROM recomendaciones_mantenimiento 
        ORDER BY tipo_mantenimiento
      `;
      return result;
    } catch (error) {
      this.logger.error('❌ Error al obtener recomendaciones:', error);
      throw error;
    }
  }

  async getMotorcycleDetails(moto_id: number, cliente_id: number): Promise<any> {
    try {
      const result = await this.db.query`
        SELECT id, marca, modelo, kilometraje 
        FROM motos 
        WHERE id = ${moto_id} AND cliente_id = ${cliente_id}
        LIMIT 1
      `;
      return result[0] || null;
    } catch (error) {
      this.logger.error('❌ Error al obtener detalles de motocicleta:', error);
      throw error;
    }
  }

  async createSavingsEstimate(data: {
    moto_id: number;
    cliente_id: number;
    tipo_mantenimiento: string;
    ahorro_estimado: number;
    kilometraje_ahorrado: number;
    detalles: string;
  }): Promise<any> {
    try {
      const result = await this.db.query`
        INSERT INTO estimaciones_ahorro (
          moto_id, cliente_id, tipo_mantenimiento, ahorro_estimado, 
          kilometraje_ahorrado, detalles
        )
        VALUES (
          ${data.moto_id}, ${data.cliente_id}, ${data.tipo_mantenimiento}, 
          ${data.ahorro_estimado}, ${data.kilometraje_ahorrado}, ${data.detalles}
        )
        RETURNING *
      `;
      this.logger.log(`✅ Estimación guardada para moto ${data.moto_id}`);
      return result[0];
    } catch (error) {
      this.logger.error('❌ Error al crear estimación de ahorro:', error);
      throw error;
    }
  }
}
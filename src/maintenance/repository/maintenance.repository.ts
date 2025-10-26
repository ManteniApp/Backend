/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { Maintenance } from '../../domain/entities/maintenance.entity';

@Injectable()
export class MaintenanceRepository {
  private readonly logger = new Logger(MaintenanceRepository.name);

  constructor(private readonly db: DatabaseService) {}

  async create(data: Omit<Maintenance, 'id'>): Promise<Maintenance> {
    this.logger.log(`🛠️ Creating maintenance: ${JSON.stringify(data)}`);

    const result = await this.db.client<Maintenance[]>`
      INSERT INTO mantenimientos (moto_id, fecha, tipo, descripcion, kilometraje, costo)
      VALUES (${data.moto_id}, ${data.fecha}, ${data.tipo}, ${data.descripcion}, ${data.kilometraje}, ${data.costo})
      RETURNING *;
    `;

    return result[0];
  }

  async findByMoto(motoId: number): Promise<Maintenance[]> {
    return await this.db.client<Maintenance[]>`
      SELECT * FROM mantenimientos WHERE moto_id = ${motoId} ORDER BY fecha DESC;
    `;
  }

  async findUpcoming(motoId: number): Promise<Maintenance[]> {
    return await this.db.client<Maintenance[]>`
      SELECT * FROM mantenimientos
      WHERE moto_id = ${motoId} AND fecha > NOW()
      ORDER BY fecha ASC;
    `;
  }

  async findOilChanges(motoId: number): Promise<Maintenance[]> {
    return await this.db.client<Maintenance[]>`
      SELECT * FROM mantenimientos
      WHERE moto_id = ${motoId} AND LOWER(tipo) LIKE '%aceite%'
      ORDER BY fecha DESC;
    `;
  }

  async delete(id: number): Promise<void> {
    await this.db.client`
      DELETE FROM mantenimientos WHERE id = ${id};
    `;
  }

  async findById(id: number): Promise<Maintenance | null> {
    const result = await this.db.client<Maintenance[]>`
      SELECT * FROM mantenimientos WHERE id = ${id};
    `;
    return result[0] || null;
  }

  async update(id: number, data: any): Promise<Maintenance> {
    this.logger.log(`🔄 Actualizando mantenimiento ${id}: ${JSON.stringify(data)}`);
    if (!data || Object.keys(data).length === 0) {
      throw new Error('No hay campos para actualizar');
    }
    try {
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error(`Mantenimiento con ID ${id} no encontrado`);
      }
      const keys = Object.keys(data);
      let query = this.db.client`UPDATE mantenimientos SET `;
      keys.forEach((key, index) => {
        if (index > 0) {
          query = this.db.client`${query}, `;
        }
        switch (key) {
          case 'descripcion':
            query = this.db.client`${query} descripcion = ${data[key]}`;
            break;
          case 'costo':
            query = this.db.client`${query} costo = ${data[key]}`;
            break;
          case 'kilometraje':
            query = this.db.client`${query} kilometraje = ${data[key]}`;
            break;
          case 'tipo':
            query = this.db.client`${query} tipo = ${data[key]}`;
            break;
          case 'fecha':
            query = this.db.client`${query} fecha = ${data[key]}`;
            break;
          case 'moto_id':
            query = this.db.client`${query} moto_id = ${data[key]}`;
            break;
          default:
            query = this.db.client`${query} ${this.db.client(key)} = ${data[key]}`;
        }
      });
      query = this.db.client`${query} WHERE id = ${id} RETURNING *`;
      const result = await query;
      if (!result || result.length === 0) {
        throw new Error('Mantenimiento no encontrado después de la actualización');
      }
      this.logger.log(`✅ Mantenimiento ${id} actualizado correctamente`);
      return result[0];
    } catch (error) {
      this.logger.error('Error en consulta UPDATE:', error);
      throw new Error(`Error al actualizar mantenimiento: ${error.message}`);
    }
  }

  async getStats(motoId: number): Promise<{
    totalMaintenances: number;
    totalCost: number;
    lastMaintenance: string | null;
    nextMaintenance: string | null;
    averageCost: number;
  }> {
    const stats = await this.db.client<any[]>`
      SELECT 
        COUNT(*) as total_maintenances,
        COALESCE(SUM(costo), 0) as total_cost,
        COALESCE(AVG(costo), 0) as average_cost,
        MAX(fecha) as last_maintenance,
        (SELECT fecha FROM mantenimientos WHERE moto_id = ${motoId} AND fecha > NOW() ORDER BY fecha ASC LIMIT 1) as next_maintenance
      FROM mantenimientos 
      WHERE moto_id = ${motoId};
    `;
    return {
      totalMaintenances: parseInt(stats[0].total_maintenances) || 0,
      totalCost: parseFloat(stats[0].total_cost) || 0,
      averageCost: parseFloat(stats[0].average_cost) || 0,
      lastMaintenance: stats[0].last_maintenance,
      nextMaintenance: stats[0].next_maintenance,
    };
  }

  async findByDateRange(motoId: number, startDate: string, endDate: string): Promise<Maintenance[]> {
    return await this.db.client<Maintenance[]>`
      SELECT * FROM mantenimientos 
      WHERE moto_id = ${motoId} 
        AND fecha >= ${startDate} 
        AND fecha <= ${endDate}
      ORDER BY fecha DESC;
    `;
  }

  async findByType(motoId: number, tipo: string): Promise<Maintenance[]> {
    return await this.db.client<Maintenance[]>`
      SELECT * FROM mantenimientos 
      WHERE moto_id = ${motoId} 
        AND LOWER(tipo) LIKE ${'%' + tipo.toLowerCase() + '%'}
      ORDER BY fecha DESC;
    `;
  }

  async getMaintenanceCostByMonth(motoId: number, year: number): Promise<{ month: number, total: number }[]> {
    const result = await this.db.client<any[]>`
      SELECT 
        EXTRACT(MONTH FROM fecha) as month,
        COALESCE(SUM(costo), 0) as total
      FROM mantenimientos 
      WHERE moto_id = ${motoId} 
        AND EXTRACT(YEAR FROM fecha) = ${year}
      GROUP BY EXTRACT(MONTH FROM fecha)
      ORDER BY month ASC;
    `;
    return result.map(row => ({
      month: parseInt(row.month),
      total: parseFloat(row.total)
    }));
  }
}
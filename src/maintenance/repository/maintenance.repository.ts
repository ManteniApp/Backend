/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service';
import { Maintenance } from '../../domain/entities/maintenance.entity';

@Injectable()
export class MaintenanceRepository {
  private readonly logger = new Logger(MaintenanceRepository.name);

  constructor(private readonly db: DatabaseService) {}

  async create(data: Omit<Maintenance, 'id'>): Promise<Maintenance> {
    try {
      this.logger.log(`🛠️ Creating maintenance: ${JSON.stringify(data)}`);

      const result = await this.db.client<Maintenance[]>`
        INSERT INTO mantenimientos (moto_id, fecha, tipo, descripcion, kilometraje, costo)
        VALUES (${data.moto_id}, ${data.fecha}, ${data.tipo}, ${data.descripcion}, ${data.kilometraje}, ${data.costo})
        RETURNING *;
      `;

      return result[0];
    } catch (error) {
      this.logger.error('❌ Error creating maintenance', error);
      throw new InternalServerErrorException('Error al crear el mantenimiento');
    }
  }

  async findById(id: number): Promise<Maintenance | null> {
    try {
      const result = await this.db.client<Maintenance[]>`
        SELECT * FROM mantenimientos WHERE id = ${id}
      `;
      return result[0] ?? null;
    } catch (error) {
      this.logger.error('❌ Error fetching maintenance by ID', error);
      throw new InternalServerErrorException('Error al obtener el mantenimiento');
    }
  }

  async findByMoto(motoId: number): Promise<Maintenance[]> {
    try {
      return await this.db.client<Maintenance[]>`
        SELECT * FROM mantenimientos WHERE moto_id = ${motoId} ORDER BY fecha DESC;
      `;
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener los mantenimientos por moto');
    }
  }

  async findUpcoming(motoId: number): Promise<Maintenance[]> {
    try {
      return await this.db.client<Maintenance[]>`
        SELECT * FROM mantenimientos
        WHERE moto_id = ${motoId} AND fecha > NOW()
        ORDER BY fecha ASC;
      `;
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener mantenimientos próximos');
    }
  }

  async findOilChanges(motoId: number): Promise<Maintenance[]> {
    try {
      return await this.db.client<Maintenance[]>`
        SELECT * FROM mantenimientos
        WHERE moto_id = ${motoId} AND LOWER(tipo) LIKE '%aceite%'
        ORDER BY fecha DESC;
      `;
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener registros de aceite');
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await this.db.client`
        DELETE FROM mantenimientos WHERE id = ${id}
      `;
    } catch (error) {
      throw new InternalServerErrorException('Error al eliminar el mantenimiento');
    }
  }
}

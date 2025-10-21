/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, Logger } from '@nestjs/common';    
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
}

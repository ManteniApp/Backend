/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service';

export type MotorcycleSpecRow = {
  id: number;
  marca: string;
  modelo: string;
  cilindraje?: number;
  tipo?: string;
  potencia?: string;
  combustible?: string;
  transmision?: string;
  peso?: string;
};

@Injectable()
export class MotorcycleSpecsRepository {
  private readonly logger = new Logger(MotorcycleSpecsRepository.name);

  constructor(private readonly db: DatabaseService) {}

  async findByMarcaAndModelo(
    marca: string,
    modelo: string,
  ): Promise<MotorcycleSpecRow | null> {
    try {
      const result = await this.db.query`
        SELECT * FROM motorcycle_specs
        WHERE marca ILIKE ${marca} AND modelo ILIKE ${modelo}
        LIMIT 1
      `;
      return result[0] || null;
    } catch (error) {
      this.logger.error('❌ Error al buscar especificaciones:', error);
      throw error;
    }
  }

  async findAll(): Promise<MotorcycleSpecRow[]> {
    try {
      const result = await this.db.query`
        SELECT * FROM motorcycle_specs
        ORDER BY marca, modelo
      `;
      return result;
    } catch (error) {
      this.logger.error('❌ Error al obtener todas las especificaciones:', error);
      throw error;
    }
  }

  async create(spec: Omit<MotorcycleSpecRow, 'id'>): Promise<MotorcycleSpecRow> {
    try {
      const result = await this.db.query`
        INSERT INTO motorcycle_specs (
          marca, modelo, cilindraje, tipo, potencia, combustible, transmision, peso
        ) VALUES (
          ${spec.marca}, ${spec.modelo}, ${spec.cilindraje || null}, ${spec.tipo || null},
          ${spec.potencia || null}, ${spec.combustible || null}, ${spec.transmision || null},
          ${spec.peso || null}
        )
        RETURNING *
      `;
      this.logger.log(`✅ Especificación creada para ${spec.marca} ${spec.modelo}`);
      return result[0];
    } catch (error) {
      this.logger.error('❌ Error al crear especificación:', error);
      throw error;
    }
  }

  async deleteById(id: number): Promise<void> {
    try {
      const result = await this.db.query`
        DELETE FROM motorcycle_specs WHERE id = ${id} RETURNING id
      `;
      if (result.length === 0) {
        throw new NotFoundException(`Especificación con id ${id} no encontrada`);
      }
      this.logger.log(`✅ Especificación eliminada con id ${id}`);
    } catch (error) {
      this.logger.error('❌ Error al eliminar especificación:', error);
      throw error;
    }
  }
  
}

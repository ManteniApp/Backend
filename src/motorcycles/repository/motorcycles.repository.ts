/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, Logger, NotFoundException } from '@nestjs/common'; // 👈 Agregamos NotFoundException para delete si es necesario
import { DatabaseService } from '../../infrastructure/database/database.service';

export type MotorcycleRow = {
  id: number;
  cliente_id: number;
  marca: string;
  modelo: string;
  placa: string;
  anio?: number;
  kilometraje?: number;
};

@Injectable()
export class MotorcyclesRepository {
  private readonly logger = new Logger(MotorcyclesRepository.name);

  constructor(private readonly db: DatabaseService) { }

  async create(data: Omit<MotorcycleRow, 'id'>): Promise<MotorcycleRow> {
    try {
      const result = await this.db.query`
        INSERT INTO motos (cliente_id, marca, modelo, placa, anio, kilometraje)
        VALUES (${data.cliente_id}, ${data.marca}, ${data.modelo}, ${data.placa}, ${data.anio || null}, ${data.kilometraje || null})
        RETURNING *
      `;
      this.logger.log(`✅ Motocicleta creada en BD con id ${result[0].id}`);
      return result[0];
    } catch (error) {
      this.logger.error('❌ Error al crear motocicleta en BD:', error);
      throw error;
    }
  }

  async findByPlacaAndUserId(placa: string, cliente_id: number): Promise<MotorcycleRow | null> {
    try {
      const result = await this.db.query`
      SELECT * FROM motos 
      WHERE placa = ${placa} AND cliente_id = ${cliente_id}
    `;
      return result[0] || null;
    } catch (error) {
      this.logger.error('❌ Error al buscar motocicleta por placa y usuario:', error);
      throw error;
    }
  }

  async findByPlaca(placa: string): Promise<MotorcycleRow | null> {
    try {
      const result = await this.db.query`
        SELECT * FROM motos 
        WHERE placa = ${placa}
      `;
      return result[0] || null;
    } catch (error) {
      this.logger.error('❌ Error al buscar motocicleta por placa:', error);
      throw error;
    }
  }

  async findAllByUserId(cliente_id: number): Promise<MotorcycleRow[]> {
    try {
      const result = await this.db.query`
        SELECT * FROM motos 
        WHERE cliente_id = ${cliente_id}
        ORDER BY id DESC
      `;
      this.logger.log(`✅ Encontradas ${result.length} motocicletas para usuario ${cliente_id}`);
      return result;
    } catch (error) {
      this.logger.error('❌ Error al buscar motocicletas por usuario:', error);
      throw error;
    }
  }

  // 👈 NUEVO: Buscar moto por ID y verificar que pertenezca al usuario (para ownership)
  async findByIdAndUserId(id: number, cliente_id: number): Promise<MotorcycleRow | null> {
    try {
      const result = await this.db.query`
        SELECT * FROM motos 
        WHERE id = ${id} AND cliente_id = ${cliente_id}
      `;
      return result[0] || null;
    } catch (error) {
      this.logger.error('❌ Error al buscar motocicleta por ID y usuario:', error);
      throw error;
    }
  }

  // 👈 NUEVO: Actualizar moto de forma parcial (usa COALESCE para mantener valores existentes si no se proporcionan)
  async update(
    id: number, 
    updates: Partial<{
      marca: string;
      modelo: string;
      placa: string;
      anio: number;
      kilometraje: number;
    }>
  ): Promise<MotorcycleRow> {
    try {
      const result = await this.db.query`
        UPDATE motos 
        SET 
          marca = COALESCE(${updates.marca}, marca),
          modelo = COALESCE(${updates.modelo}, modelo),
          placa = COALESCE(${updates.placa}, placa),
          anio = COALESCE(${updates.anio}, anio),
          kilometraje = COALESCE(${updates.kilometraje}, kilometraje)
        WHERE id = ${id}
        RETURNING *
      `;
      if (result.length === 0) {
        throw new NotFoundException(`Motocicleta con id ${id} no encontrada`);
      }
      this.logger.log(`✅ Motocicleta actualizada en BD con id ${result[0].id}`);
      return result[0];
    } catch (error) {
      this.logger.error('❌ Error al actualizar motocicleta en BD:', error);
      throw error;
    }
  }

  // 👈 NUEVO: Eliminar moto por ID
  async delete(id: number): Promise<void> {
    try {
      const result = await this.db.query`
        DELETE FROM motos 
        WHERE id = ${id} 
        RETURNING id
      `;
      if (result.length === 0) {
        this.logger.warn(`⚠️ Intento de eliminar motocicleta con id ${id} que no existe`);
        // No lanzamos error aquí, ya que el servicio verifica antes
      } else {
        this.logger.log(`✅ Motocicleta eliminada de BD con id ${result[0].id}`);
      }
    } catch (error) {
      this.logger.error('❌ Error al eliminar motocicleta en BD:', error);
      throw error;
    }
  }
}
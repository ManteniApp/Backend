/* eslint-disable prettier/prettier */
import { Injectable, Logger } from '@nestjs/common';
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

  constructor(private readonly db: DatabaseService) {}

  async create(data: Omit<MotorcycleRow, 'id'>): Promise<MotorcycleRow> {
    // Implementar la creación de la motocicleta en la base de datos y asociar con el usuario
  }

  async findByPlaca(placa: string): Promise<MotorcycleRow | null> {
    // Implementar la búsqueda por placa
  }
}

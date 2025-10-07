/* eslint-disable prettier/prettier */
import { Injectable, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { MotorcyclesRepository } from '../repository/motorcycles.repository';


@Injectable()
export class MotorcyclesService {
  private readonly logger = new Logger(MotorcyclesService.name);

  constructor(private readonly motorcyclesRepo: MotorcyclesRepository) {}

  async createMotorcycle(data: {
    cliente_id: number;
    marca: string;
    modelo: string;
    placa: string;
    anio?: number;
    kilometraje?: number;
  }) {
    // Validaciones básicas
    if (!data.cliente_id || !data.marca || !data.modelo || !data.placa) {
      throw new BadRequestException('Campos requeridos: cliente_id, marca, modelo y placa');
    }

    // Validar placa única
    const existing = await this.motorcyclesRepo.findByPlaca(data.placa);
    if (existing) {
      throw new ConflictException(`Ya existe una motocicleta con la placa ${data.placa}`);
    }

    // Validar año si viene
    if (data.anio && (data.anio < 1980 || data.anio > new Date().getFullYear() + 1)) {
      throw new BadRequestException('El año de la motocicleta no es válido');
    }

    // Crear registro
    const moto = await this.motorcyclesRepo.create(data);
    this.logger.log(`✅ Motocicleta creada con id ${moto.id}`);
    return moto;
  }
}

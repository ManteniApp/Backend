/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, BadRequestException, ConflictException, Logger, NotFoundException } from '@nestjs/common';
import { MotorcyclesRepository } from '../repository/motorcycles.repository';
import { MotorcycleSpecsRepository } from '../repository/motorcycle-specs.repository';
@Injectable()
export class MotorcyclesService {
  private readonly logger = new Logger(MotorcyclesService.name);

  constructor(private readonly motorcyclesRepo: MotorcyclesRepository,
              private readonly motorcycleSpecsRepo : MotorcycleSpecsRepository,
  ) {}

  async createMotorcycle(data: {
    cliente_id: number;
    marca: string;
    modelo: string;
    placa: string;
    anio?: number;
    kilometraje?: number;
  }) {
    if (!data.cliente_id || !data.marca || !data.modelo || !data.placa) {
      throw new BadRequestException('Campos requeridos: cliente_id, marca, modelo y placa');
    }

    const existing = await this.motorcyclesRepo.findByPlaca(data.placa);
    if (existing) {
      throw new ConflictException(`Ya existe una motocicleta con la placa ${data.placa}`);
    }

    if (data.anio && (data.anio < 1980 || data.anio > new Date().getFullYear() + 1)) {
      throw new BadRequestException('El año de la motocicleta no es válido');
    }

    const moto = await this.motorcyclesRepo.create(data);
    this.logger.log(`✅ Motocicleta creada con id ${moto.id}`);
    return moto;
  }

  async findAllByUserId(userId: number) {
    this.logger.log(`Buscando motocicletas para el usuario con id ${userId}`);
    if (!userId) {
      throw new BadRequestException('El ID de usuario es requerido');
    }
    const motos = await this.motorcyclesRepo.findAllByUserId(userId);
    return motos.map((moto) => ({
      id: moto.id,
      marca: moto.marca,  
      modelo : moto.modelo,
      placa: moto.placa,
      año: moto.anio,
      kilometraje: moto.kilometraje,
    }));
  }

  async findByPlaca(placa: string, userId: number) {
    this.logger.log(`Buscando motocicleta con placa: ${placa} para usuario: ${userId}`);
    
    if (!placa) {
      throw new BadRequestException('La placa es requerida');
    }

    if (!userId) {
      throw new BadRequestException('Usuario no autenticado');
    }

    if (placa.length < 3 || placa.length > 20) {
      throw new BadRequestException('La placa debe tener entre 3 y 20 caracteres');
    }

    const moto = await this.motorcyclesRepo.findByPlacaAndUserId(placa, userId);
    
    if (!moto) {
      throw new NotFoundException(`No tienes registrada una motocicleta con la placa ${placa}`);
    }

    this.logger.log(`✅ Motocicleta encontrada con id ${moto.id}`);
    
    return {
      id: moto.id,
      cliente_id: moto.cliente_id,
      marca: moto.marca,
      modelo: moto.modelo,
      placa: moto.placa,
      anio: moto.anio,
      kilometraje: moto.kilometraje,
    };
  }

  // 👈 NUEVO: Actualizar motocicleta (verifica ownership y unicidad de placa si cambia)
  async updateMotorcycle(
    id: number,
    updates: Partial<{
      marca: string;
      modelo: string;
      placa: string;
      anio?: number;
      kilometraje?: number;
    }>,
    userId: number
  ) {
    this.logger.log(`Actualizando motocicleta con id ${id} para usuario ${userId}`);

    if (!userId) {
      throw new BadRequestException('Usuario no autenticado');
    }

    // Verificar que la moto existe y pertenece al usuario
    const existing = await this.motorcyclesRepo.findByIdAndUserId(id, userId);
    if (!existing) {
      throw new NotFoundException(`No tienes una motocicleta con id ${id}`);
    }

    // Si no hay campos para actualizar, retornar la existente
    if (Object.keys(updates).length === 0) {
      return {
        id: existing.id,
        marca: existing.marca,
        modelo: existing.modelo,
        placa: existing.placa,
        año: existing.anio,
        kilometraje: existing.kilometraje,
      };
    }

    // Validar placa si se proporciona y cambia
    let newPlaca = existing.placa;
    if (updates.placa !== undefined && updates.placa !== existing.placa) {
      newPlaca = updates.placa;
      const placaExists = await this.motorcyclesRepo.findByPlaca(newPlaca);
      if (placaExists && placaExists.id !== id) {
        throw new ConflictException(`Ya existe una motocicleta con la placa ${newPlaca}`);
      }
    }

    // Validaciones adicionales (solo si se proporcionan)
    if (updates.marca && (!updates.marca || updates.marca.trim() === '')) {
      throw new BadRequestException('La marca es requerida si se proporciona');
    }
    if (updates.modelo && (!updates.modelo || updates.modelo.trim() === '')) {
      throw new BadRequestException('El modelo es requerido si se proporciona');
    }
    if (updates.placa && (!updates.placa || updates.placa.trim() === '')) {
      throw new BadRequestException('La placa es requerida si se proporciona');
    }
    if (updates.anio && (updates.anio < 1980 || updates.anio > new Date().getFullYear() + 1)) {
      throw new BadRequestException('El año de la motocicleta no es válido');
    }

    // Actualizar en BD
    const updated = await this.motorcyclesRepo.update(id, updates);
    this.logger.log(`✅ Motocicleta actualizada con id ${updated.id}`);

    // Retornar formato consistente (sin cliente_id, con 'año')
    return {
      id: updated.id,
      marca: updated.marca,
      modelo: updated.modelo,
      placa: updated.placa,
      año: updated.anio,
      kilometraje: updated.kilometraje,
    };
  }

  // 👈 NUEVO: Eliminar motocicleta (verifica ownership)
  async deleteMotorcycle(id: number, userId: number) {
    this.logger.log(`Eliminando motocicleta con id ${id} para usuario ${userId}`);

    if (!userId) {
      throw new BadRequestException('Usuario no autenticado');
    }

    // Verificar que la moto existe y pertenece al usuario
    const existing = await this.motorcyclesRepo.findByIdAndUserId(id, userId);
    if (!existing) {
      throw new NotFoundException(`No tienes una motocicleta con id ${id}`);
    }

    // Eliminar en BD
    await this.motorcyclesRepo.delete(id);
    this.logger.log(`✅ Motocicleta eliminada con id ${id}`);

    return { message: 'Motocicleta eliminada exitosamente' };
  }

  async getMotorcycleSpecs(marca: string, modelo: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const specs = await this.motorcycleSpecsRepo.findByMarcaAndModelo(marca, modelo);
    if (!specs) {
      throw new NotFoundException(`No se encontraron especificaciones para ${marca} ${modelo}`);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return specs;
  }

  async getAllSpecs() {
  return this.motorcycleSpecsRepo.findAll();
}

}
/* eslint-disable prettier/prettier */
import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { MaintenanceRepository } from '../repository/maintenance.repository';
import { Maintenance } from '../../domain/entities/maintenance.entity';

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(private readonly maintenanceRepo: MaintenanceRepository) { }

  private validateMaintenanceData(data: {
    moto_id: number;
    fecha: string; // Cambiar a string para validación
    tipo: string;
    descripcion?: string;
    kilometraje?: number;
    costo?: number;
  }): void {

    if (!data.moto_id || !data.fecha || !data.tipo) {
      throw new BadRequestException('Campos requeridos: moto_id, fecha y tipo.');
    }
    if (data.moto_id <= 0) {
      throw new BadRequestException('El ID de la moto debe ser un número positivo.');
    }
    // Validación de fecha (viene como string)
    const fecha = new Date(data.fecha);
    if (isNaN(fecha.getTime())) {
      throw new BadRequestException('La fecha proporcionada no es válida.');
    }
    const now = new Date();
    if (fecha > new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)) {
      throw new BadRequestException('La fecha no puede ser más de un año en el futuro.');
    }
    if (data.tipo.trim().length === 0) {
      throw new BadRequestException('El tipo de mantenimiento no puede estar vacío.');
    }
    if (data.tipo.length > 100) {
      throw new BadRequestException('El tipo de mantenimiento no puede exceder los 100 caracteres.');
    }
    if (data.kilometraje !== undefined && data.kilometraje < 0) {
      throw new BadRequestException('El kilometraje no puede ser negativo.');
    }
    if (data.costo !== undefined && data.costo < 0) {
      throw new BadRequestException('El costo no puede ser negativo.');
    }
    if (data.costo !== undefined && data.costo > 1000000) {
      throw new BadRequestException('El costo no puede exceder 1,000,000.');
    }
    if (data.descripcion && data.descripcion.length > 500) {
      throw new BadRequestException('La descripción no puede exceder los 500 caracteres.');
    }
  }

  private validateId(id: number, fieldName: string = 'ID'): void {
    if (!id || id <= 0) {
      throw new BadRequestException(`${fieldName} debe ser un número positivo.`);
    }
  }

  async createMaintenance(data: {
    moto_id: number;
    fecha: string; // Cambiar a string
    tipo: string;
    descripcion?: string;
    kilometraje?: number;
    costo?: number;
  }): Promise<Maintenance> {
    try {
      this.validateMaintenanceData(data);

      // Convertir fecha de string a Date para la base de datos
      const maintenanceData = {
        ...data,
        fecha: new Date(data.fecha),
      };

      const newMaintenance = await this.maintenanceRepo.create(maintenanceData);
      return newMaintenance;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al crear el mantenimiento');
    }
  }

  async getMaintenancesByMoto(motoId: number): Promise<Maintenance[]> {
    this.validateId(motoId, 'El ID de la moto');
    return this.maintenanceRepo.findByMoto(motoId);
  }

  async getUpcomingMaintenances(motoId: number): Promise<Maintenance[]> {
    this.validateId(motoId, 'El ID de la moto');
    return this.maintenanceRepo.findUpcoming(motoId);
  }

  async getOilChangeRecords(motoId: number): Promise<Maintenance[]> {
    this.validateId(motoId, 'El ID de la moto');
    return this.maintenanceRepo.findOilChanges(motoId);
  }

  async getMaintenanceById(id: number): Promise<Maintenance> {
    this.validateId(id, 'El ID del mantenimiento');
    const maintenance = await this.maintenanceRepo.findById(id);
    if (!maintenance) {
      throw new NotFoundException(`Mantenimiento con ID ${id} no encontrado.`);
    }
    return maintenance;
  }

  async updateMaintenance(id: number, data: {
    fecha?: string;
    tipo?: string;
    descripcion?: string;
    kilometraje?: number;
    costo?: number;
    moto_id?: number;
  }): Promise<Maintenance> {
    this.validateId(id, 'El ID del mantenimiento');

    // Verificar que existe antes de actualizar
    const exists = await this.maintenanceRepo.findById(id);
    if (!exists) {
      throw new NotFoundException(`Mantenimiento con ID ${id} no encontrado.`);
    }

    // Validar campos que NO se pueden actualizar
    const nonUpdatableFields: string[] = [];

    // SOLUCIÓN DEFINITIVA: Verificar existencia de campos
    if (data.hasOwnProperty('fecha')) {
      nonUpdatableFields.push('fecha');
    }
    if (data.hasOwnProperty('tipo')) {
      nonUpdatableFields.push('tipo');
    }
    if (data.hasOwnProperty('kilometraje')) {
      nonUpdatableFields.push('kilometraje');
    }
    if (data.hasOwnProperty('moto_id')) {
      nonUpdatableFields.push('moto_id');
    }

    if (nonUpdatableFields.length > 0) {
      throw new BadRequestException(
        `Los siguientes campos no se pueden actualizar: ${nonUpdatableFields.join(', ')}. ` +
        `Solo se permite actualizar: descripción y costo.`
      );
    }

    // Solo procesar campos permitidos
    const updateData: any = {};

    if (data.descripcion !== undefined) {
      if (data.descripcion.length > 500) {
        throw new BadRequestException('La descripción no puede exceder los 500 caracteres.');
      }
      updateData.descripcion = data.descripcion;
    }

    if (data.costo !== undefined) {
      if (data.costo < 0) {
        throw new BadRequestException('Costo no puede ser negativo.');
      }
      if (data.costo > 1000000) {
        throw new BadRequestException('El costo no puede exceder 1,000,000.');
      }
      updateData.costo = data.costo;
    }

    // Verificar que hay campos permitidos para actualizar
    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException(
        'No hay campos válidos para actualizar. ' +
        'Solo se permite actualizar: descripción y costo.'
      );
    }

    try {
      return await this.maintenanceRepo.update(id, updateData);
    } catch (error) {
      this.logger.error('Error al actualizar mantenimiento:', error);
      throw new InternalServerErrorException('Error al actualizar el mantenimiento');
    }
  }

  async deleteMaintenance(id: number): Promise<void> {
    this.validateId(id, 'El ID del mantenimiento');

    this.logger.log(`🗑️ Intentando eliminar mantenimiento con ID: ${id}`);

    // Verificar que existe
    const maintenance = await this.maintenanceRepo.findById(id);

    this.logger.debug(`🔍 Resultado de búsqueda: ${JSON.stringify(maintenance)}`);

    if (!maintenance) {
      this.logger.error(`❌ Mantenimiento con ID ${id} no encontrado para eliminar`);
      throw new NotFoundException(`Mantenimiento con ID ${id} no encontrado.`);
    }

    this.logger.log(`✅ Mantenimiento encontrado, procediendo a eliminar...`);

    await this.maintenanceRepo.delete(id);

    this.logger.log(`✅ Mantenimiento ${id} eliminado correctamente`);
  }

  async getMaintenanceStats(motoId: number): Promise<{
    totalMaintenances: number;
    totalCost: number;
    lastMaintenance: string | null;
    nextMaintenance: string | null;
    averageCost: number;
  }> {
    this.validateId(motoId, 'El ID de la moto');
    return this.maintenanceRepo.getStats(motoId);
  }

  async getMaintenancesByDateRange(motoId: number, startDate: string, endDate: string): Promise<Maintenance[]> {
    this.validateId(motoId, 'El ID de la moto');
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Las fechas proporcionadas no son válidas.');
    }
    if (start > end) {
      throw new BadRequestException('La fecha de inicio no puede ser mayor que la fecha de fin.');
    }
    return this.maintenanceRepo.findByDateRange(motoId, startDate, endDate);
  }

  async getMaintenancesByType(motoId: number, tipo: string): Promise<Maintenance[]> {
    this.validateId(motoId, 'El ID de la moto');
    if (!tipo || tipo.trim().length === 0) {
      throw new BadRequestException('El tipo de mantenimiento es requerido.');
    }
    return this.maintenanceRepo.findByType(motoId, tipo);
  }

  async getMaintenanceCostByMonth(motoId: number, year?: number): Promise<{ month: number, total: number }[]> {
    this.validateId(motoId, 'El ID de la moto');
    const currentYear = year || new Date().getFullYear();
    if (currentYear < 2000 || currentYear > 2100) {
      throw new BadRequestException('El año debe estar entre 2000 y 2100.');
    }
    return this.maintenanceRepo.getMaintenanceCostByMonth(motoId, currentYear);
  }

}
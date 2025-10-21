/* eslint-disable prettier/prettier */
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { MaintenanceRepository } from '../repository/maintenance.repository';
import { Maintenance } from '../../domain/entities/maintenance.entity';

@Injectable()
export class MaintenanceService {
  constructor(private readonly maintenanceRepo: MaintenanceRepository) {}

  async createMaintenance(data: {
    moto_id: number;
    fecha: string;  
    tipo: string;
    descripcion?: string;
    kilometraje?: number;
    costo?: number;
  }): Promise<Maintenance> {
    if (!data.moto_id || !data.fecha || !data.tipo) {
      throw new BadRequestException('Campos requeridos: moto_id, fecha y tipo.');
    }

    const newMaintenance = await this.maintenanceRepo.create({
      ...data,
      fecha: new Date(data.fecha),
    });

    return newMaintenance;
  }

  async getMaintenancesByMoto(motoId: number): Promise<Maintenance[]> {
    if (!motoId) throw new BadRequestException('El ID de la moto es requerido');
    return this.maintenanceRepo.findByMoto(motoId);
  }

  async getUpcomingMaintenances(motoId: number): Promise<Maintenance[]> {
    return this.maintenanceRepo.findUpcoming(motoId);
  }

  async getOilChangeRecords(motoId: number): Promise<Maintenance[]> {
    return this.maintenanceRepo.findOilChanges(motoId);
  }

  async deleteMaintenance(id: number): Promise<void> {
    const records = await this.maintenanceRepo.findByMoto(id);
    if (!records.length) throw new NotFoundException('Mantenimiento no encontrado');
    await this.maintenanceRepo.delete(id);
  }
}

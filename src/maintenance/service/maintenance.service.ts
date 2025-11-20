/* eslint-disable prettier/prettier */
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
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
      throw new BadRequestException(
        'Campos requeridos: moto_id, fecha y tipo.',
      );
    }

    return this.maintenanceRepo.create({
      ...data,
      fecha: new Date(data.fecha),
    });
  }

  async getMaintenancesByMoto(motoId: number): Promise<Maintenance[]> {
    if (!motoId) throw new BadRequestException('El ID de la moto es requerido');
    return this.maintenanceRepo.findByMoto(motoId);
  }

  async getUpcomingMaintenances(motoId: number): Promise<Maintenance[]> {
    if (!motoId)
      throw new BadRequestException('El ID de la moto es requerido');
    return this.maintenanceRepo.findUpcoming(motoId);
  }

  async getOilChangeRecords(motoId: number): Promise<Maintenance[]> {
    if (!motoId)
      throw new BadRequestException('El ID de la moto es requerido');
    return this.maintenanceRepo.findOilChanges(motoId);
  }

  async deleteMaintenance(id: number): Promise<void> {
    if (!id) throw new BadRequestException('El ID del mantenimiento es requerido');

    const record = await this.maintenanceRepo.findById(id);
    if (!record) throw new NotFoundException('Mantenimiento no encontrado');

    await this.maintenanceRepo.delete(id);
  }
}

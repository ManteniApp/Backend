/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { MaintenanceService } from '../service/maintenance.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body()
    body: {
      moto_id: number;
      fecha: string;
      tipo: string;
      descripcion?: string;
      kilometraje?: number;
      costo?: number;
    },
  ) {
    return this.maintenanceService.createMaintenance(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':motoId')
  async getByMoto(@Param('motoId') motoId: number) {
    return this.maintenanceService.getMaintenancesByMoto(motoId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('upcoming/:motoId')
  async getUpcoming(@Param('motoId') motoId: number) {
    return this.maintenanceService.getUpcomingMaintenances(motoId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('oil-changes/:motoId')
  async getOilChanges(@Param('motoId') motoId: number) {
    return this.maintenanceService.getOilChangeRecords(motoId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: number) {
    return this.maintenanceService.deleteMaintenance(id);
  }
}

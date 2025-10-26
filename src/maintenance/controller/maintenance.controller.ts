/* eslint-disable prettier/prettier */
import { Controller, Get, Post, Delete, Param, Body, UseGuards, Put, ParseIntPipe, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { MaintenanceService } from '../service/maintenance.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) { }

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
  async getByMoto(@Param('motoId', ParseIntPipe) motoId: number) {
    return this.maintenanceService.getMaintenancesByMoto(motoId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('detail/:id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.maintenanceService.getMaintenanceById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('upcoming/:motoId')
  async getUpcoming(@Param('motoId', ParseIntPipe) motoId: number) {
    return this.maintenanceService.getUpcomingMaintenances(motoId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('oil-changes/:motoId')
  async getOilChanges(@Param('motoId', ParseIntPipe) motoId: number) {
    return this.maintenanceService.getOilChangeRecords(motoId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats/:motoId')
  async getStats(@Param('motoId', ParseIntPipe) motoId: number) {
    return this.maintenanceService.getMaintenanceStats(motoId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('date-range/:motoId')
  async getByDateRange(
    @Param('motoId', ParseIntPipe) motoId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.maintenanceService.getMaintenancesByDateRange(motoId, startDate, endDate);
  }

  @UseGuards(JwtAuthGuard)
  @Get('type/:motoId')
  async getByType(
    @Param('motoId', ParseIntPipe) motoId: number,
    @Query('tipo') tipo: string,
  ) {
    return this.maintenanceService.getMaintenancesByType(motoId, tipo);
  }

  @UseGuards(JwtAuthGuard)
  @Get('cost-monthly/:motoId')
  async getCostByMonth(
    @Param('motoId', ParseIntPipe) motoId: number,
    @Query('year') year?: number,
  ) {
    return this.maintenanceService.getMaintenanceCostByMonth(motoId, year);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      fecha?: string;
      tipo?: string;
      descripcion?: string;
      kilometraje?: number;
      costo?: number;
      moto_id?: number;
    },
  ) {
    return this.maintenanceService.updateMaintenance(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.maintenanceService.deleteMaintenance(id);
  }
}
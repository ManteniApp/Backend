// maintenance-summary.controller.ts
import { Controller, Get, Query, UseGuards, Res, BadRequestException, ParseIntPipe, Optional, } from '@nestjs/common';
import express from 'express';
import { MaintenanceSummaryService } from '../service/maintenance-summary.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

interface MaintenanceSummaryResponse {
  totalMantenimientos: number;
  costoTotal: number;
  costoPromedio: number;
  mantenimientos: any[];
  estadisticasPorTipo: {
    tipo: string;
    cantidad: number;
    costoTotal: number;
    costoPromedio: number;
  }[];
}

@Controller('maintenance-summary')
export class MaintenanceSummaryController {
  constructor(private readonly maintenanceSummaryService: MaintenanceSummaryService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getSummary(
    @Query('motoId', new ParseIntPipe({ optional: true })) motoId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('tipo') tipo?: string,
  ): Promise<MaintenanceSummaryResponse> {
    try {
      const filters = {
        motoId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        tipo,
      };

      return await this.maintenanceSummaryService.getMaintenanceSummary(filters);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('pdf')
  async generatePdf(
    @Query('motoId', new ParseIntPipe({ optional: true })) motoId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('tipo') tipo?: string,
    @Res() res?: express.Response,
  ) {
    try {
      const filters = {
        motoId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        tipo,
      };

      const pdfBuffer = await this.maintenanceSummaryService.generatePdfReport(filters);
      
      if (res) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=resumen-mantenimientos.pdf');
        res.send(pdfBuffer);
        return;
      }

      throw new Error('Response object not available');
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
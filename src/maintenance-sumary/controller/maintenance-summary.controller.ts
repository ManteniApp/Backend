// maintenance-summary.controller.ts
import { Controller, Get, Query, UseGuards, Res, BadRequestException, ParseIntPipe, Optional } from '@nestjs/common';
import express from 'express';
import { MaintenanceSummaryService } from '../service/maintenance-summary.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

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

@ApiTags('Resumen de Mantenimientos')
@ApiBearerAuth()
@Controller('maintenance-summary')
export class MaintenanceSummaryController {
  constructor(private readonly maintenanceSummaryService: MaintenanceSummaryService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Obtener resumen de mantenimientos con filtros opcionales' })
  @ApiQuery({ name: 'motoId', required: false, type: Number, description: 'ID de la motocicleta' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Fecha inicio (YYYY-MM-DD)', example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Fecha fin (YYYY-MM-DD)', example: '2025-12-31' })
  @ApiQuery({ name: 'tipo', required: false, type: String, description: 'Tipo de mantenimiento (aceite, frenos, cadena, llantas, batería, etc.)', example: 'aceite' })
  async getSummary(
    @Query('motoId', new ParseIntPipe({ optional: true })) motoId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('tipo') tipo?: string,
  ): Promise<MaintenanceSummaryResponse> {
    try {
      // Validar que si una fecha existe, la otra también debe existir
      if ((startDate && !endDate) || (!startDate && endDate)) {
        throw new BadRequestException(
          'Debes proporcionar ambas fechas (startDate y endDate) o ninguna',
        );
      }

      // Validar formato de fecha si se proporcionan
      let startDateObj: Date | undefined;
      let endDateObj: Date | undefined;

      if (startDate && endDate) {
        startDateObj = this.parseDate(startDate);
        endDateObj = this.parseDate(endDate);

        // Validar que startDate sea menor que endDate
        if (startDateObj > endDateObj) {
          throw new BadRequestException(
            'La fecha de inicio debe ser anterior a la fecha de fin',
          );
        }
      }

      const filters = {
        motoId,
        startDate: startDateObj,
        endDate: endDateObj,
        tipo,
      };

      return await this.maintenanceSummaryService.getMaintenanceSummary(filters);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('pdf')
  @ApiOperation({ summary: 'Generar reporte PDF de mantenimientos con filtros opcionales' })
  @ApiQuery({ name: 'motoId', required: false, type: Number, description: 'ID de la motocicleta' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Fecha inicio (YYYY-MM-DD)', example: '2025-01-01' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Fecha fin (YYYY-MM-DD)', example: '2025-12-31' })
  @ApiQuery({ name: 'tipo', required: false, type: String, description: 'Tipo de mantenimiento (aceite, frenos, cadena, llantas, batería, etc.)', example: 'aceite' })
  async generatePdf(
    @Query('motoId', new ParseIntPipe({ optional: true })) motoId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('tipo') tipo?: string,
    @Res() res?: express.Response,
  ) {
    try {
      // Misma validación que en getSummary
      if ((startDate && !endDate) || (!startDate && endDate)) {
        throw new BadRequestException(
          'Debes proporcionar ambas fechas (startDate y endDate) o ninguna',
        );
      }

      let startDateObj: Date | undefined;
      let endDateObj: Date | undefined;

      if (startDate && endDate) {
        startDateObj = this.parseDate(startDate);
        endDateObj = this.parseDate(endDate);

        if (startDateObj > endDateObj) {
          throw new BadRequestException(
            'La fecha de inicio debe ser anterior a la fecha de fin',
          );
        }
      }

      const filters = {
        motoId,
        startDate: startDateObj,
        endDate: endDateObj,
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

  /**
   * Método para parsear y validar fechas
   */
  private parseDate(dateString: string): Date {
    const date = new Date(dateString);
    
    // Validar si la fecha es inválida
    if (isNaN(date.getTime())) {
      throw new BadRequestException(
        `Formato de fecha inválido: ${dateString}. Use formato YYYY-MM-DD`,
      );
    }

    return date;
  }
}
// maintenance-summary.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';

import PDFDocument from 'pdfkit';
import { MaintenanceSummaryRepository } from '../repository/maintenance-summary.repository';

interface SummaryFilters {
  motoId?: number;
  startDate?: Date;
  endDate?: Date;
  tipo?: string;
}

interface MaintenanceSummary {
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

@Injectable()
export class MaintenanceSummaryService {
  constructor(private readonly maintenanceSummaryRepo: MaintenanceSummaryRepository) {}

  async getMaintenanceSummary(filters: SummaryFilters): Promise<MaintenanceSummary> {
    try {
      const summary = await this.maintenanceSummaryRepo.getSummaryWithFilters(filters);
      
      if (summary.totalMantenimientos === 0) {
        throw new NotFoundException('No se encontraron mantenimientos con los filtros aplicados');
      }

      return summary;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error('Error al obtener el resumen de mantenimientos');
    }
  }

  async generatePdfReport(filters: SummaryFilters): Promise<Buffer> {
    try {
      const summary = await this.getMaintenanceSummary(filters);
      
      return new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });
        doc.on('error', reject);

        // Encabezado del PDF
        doc.fontSize(20).text('Resumen de Mantenimientos', { align: 'center' });
        doc.moveDown();

        // Filtros aplicados
        doc.fontSize(12).text('Filtros aplicados:', { underline: true });
        if (filters.motoId) doc.text(`Moto ID: ${filters.motoId}`);
        if (filters.startDate) doc.text(`Desde: ${filters.startDate.toLocaleDateString()}`);
        if (filters.endDate) doc.text(`Hasta: ${filters.endDate.toLocaleDateString()}`);
        if (filters.tipo) doc.text(`Tipo: ${filters.tipo}`);
        doc.moveDown();

        // Totales
        doc.text('Totales:', { underline: true });
        doc.text(`Total de mantenimientos: ${summary.totalMantenimientos}`);
        doc.text(`Costo total: $${summary.costoTotal.toFixed(2)}`);
        doc.text(`Costo promedio: $${summary.costoPromedio.toFixed(2)}`);
        doc.moveDown();

        // Estadísticas por tipo
        if (summary.estadisticasPorTipo.length > 0) {
          doc.text('Estadísticas por tipo:', { underline: true });
          summary.estadisticasPorTipo.forEach(stat => {
            doc.text(`${stat.tipo}: ${stat.cantidad} mantenimientos, Total: $${stat.costoTotal.toFixed(2)}, Promedio: $${stat.costoPromedio.toFixed(2)}`);
          });
          doc.moveDown();
        }

        // Detalles de mantenimientos
        if (summary.mantenimientos.length > 0) {
          doc.text('Detalles de mantenimientos:', { underline: true });
          summary.mantenimientos.forEach((mant, index) => {
            doc.text(`${index + 1}. ${mant.tipo} - ${new Date(mant.fecha).toLocaleDateString()} - $${mant.costo || 0}`);
          });
        }

        doc.end();
      });
    } catch (error) {
      throw new Error('Error al generar el reporte PDF');
    }
  }
}
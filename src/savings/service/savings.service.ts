/* eslint-disable prettier/prettier */
import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { SavingsRepository } from '../repository/savings.repository';
import {
    SavingsEstimate,
    SavingsResponse,
    SavingsHistoryResponse
} from '../interfaces/savings.interface';

@Injectable()
export class SavingsService {
    private readonly logger = new Logger(SavingsService.name);

    constructor(private readonly savingsRepo: SavingsRepository) { }

    async calculateSavingsByMotorcycle(moto_id: number, cliente_id: number): Promise<SavingsResponse> {
        if (!moto_id || !cliente_id) {
            throw new BadRequestException('moto_id y cliente_id son requeridos');
        }

        try {
            // Obtener datos de la motocicleta y mantenimientos
            const motorcycle = await this.savingsRepo.getMotorcycleDetails(moto_id, cliente_id);
            if (!motorcycle) {
                throw new NotFoundException('Motocicleta no encontrada');
            }

            const maintenances = await this.savingsRepo.getMaintenancesByMotorcycle(moto_id, cliente_id);
            const recommendations = await this.savingsRepo.getMaintenanceRecommendations();

            if (maintenances.length === 0) {
                return {
                    moto_id,
                    marca: motorcycle.marca,
                    modelo: motorcycle.modelo,
                    kilometraje_actual: motorcycle.kilometraje,
                    total_mantenimientos: 0,
                    ahorro_total: 0,
                    estimaciones: [],
                    resumen: {
                        total_tipos_con_ahorro: 0,
                        mayor_ahorro: null,
                        recomendacion: 'No hay mantenimientos registrados para calcular ahorros'
                    }
                };
            }

            // Agregar kilometraje actual a cada mantenimiento para el cálculo individual
            const maintenancesWithCurrentKm = maintenances.map(maint => ({
                ...maint,
                kilometraje_actual: motorcycle.kilometraje
            }));

            // Calcular ahorros por tipo de mantenimiento
            const savingsByType = await this.calculateSavingsByType(maintenancesWithCurrentKm, recommendations);

            // Calcular ahorro total
            const totalSavings = this.calculateTotalSavings(savingsByType);

            // Guardar estimaciones
            for (const estimate of savingsByType) {
                if (estimate.ahorro_estimado > 0) {
                    await this.savingsRepo.createSavingsEstimate({
                        moto_id,
                        cliente_id,
                        tipo_mantenimiento: estimate.tipo_mantenimiento,
                        ahorro_estimado: estimate.ahorro_estimado,
                        kilometraje_ahorrado: estimate.kilometraje_ahorrado,
                        detalles: estimate.detalles
                    });
                }
            }

            this.logger.log(`✅ Ahorros calculados para moto ${moto_id}: $${totalSavings}`);

            return {
                moto_id,
                marca: motorcycle.marca,
                modelo: motorcycle.modelo,
                kilometraje_actual: motorcycle.kilometraje,
                total_mantenimientos: maintenances.length,
                ahorro_total: totalSavings,
                estimaciones: savingsByType,
                resumen: this.generateSummary(savingsByType)
            };

        } catch (error) {
            this.logger.error(`❌ Error calculando ahorros para moto ${moto_id}:`, error);

            // Retornar una respuesta de error estructurada en lugar de lanzar excepción
            // o mantener el throw dependiendo de tu preferencia
            throw error;
        }
    }

    async getSavingsHistory(cliente_id: number): Promise<SavingsHistoryResponse> {
        if (!cliente_id) {
            throw new BadRequestException('cliente_id es requerido');
        }

        return {
            historial: [],
            mensaje: 'Endpoint en desarrollo - mostrará historial de estimaciones'
        };
    }

    private async calculateSavingsByType(maintenances: any[], recommendations: any[]): Promise<SavingsEstimate[]> {
        const savings: SavingsEstimate[] = [];

        // Agrupar mantenimientos por tipo
        const maintenanceByType = this.groupMaintenancesByType(maintenances);

        // Mapeo flexible de tipos
        const typeMappings = {
            'frenos': 'ajuste_frenos',
            'cambio de aceite': 'cambio_aceite',
            'aceite': 'cambio_aceite',
            'llantas': 'cambio_llantas',
            'carburador': 'limpieza_carburador'
        };

        for (const [tipo, mantenimientos] of Object.entries(maintenanceByType)) {
            // Buscar recomendación con matching flexible
            let recommendation = recommendations.find(rec =>
                rec.tipo_mantenimiento.toLowerCase() === tipo.toLowerCase()
            );

            // Si no encuentra, intentar con el mapeo
            if (!recommendation) {
                const normalizedType = tipo.toLowerCase().trim();
                const mappedType = typeMappings[normalizedType];
                if (mappedType) {
                    recommendation = recommendations.find(rec =>
                        rec.tipo_mantenimiento === mappedType
                    );
                }
            }

            if (recommendation) {
                let estimate: SavingsEstimate;

                if (mantenimientos.length === 1) {
                    estimate = this.calculateSavingsForSingleMaintenance(tipo, mantenimientos[0], recommendation);
                } else {
                    estimate = this.calculateSavingsForType(tipo, mantenimientos, recommendation);
                }

                savings.push(estimate);
            } else {
                // Tipo sin recomendación - mostrar información igual
                savings.push({
                    tipo_mantenimiento: tipo,
                    ahorro_estimado: 0,
                    kilometraje_ahorrado: 0,
                    detalles: `No se encontraron recomendaciones para "${tipo}"`,
                    mantenimientos_realizados: mantenimientos
                });
            }
        }

        return savings;
    }

    private calculateSavingsForSingleMaintenance(tipo: string, maintenance: any, recommendation: any): SavingsEstimate {
        const kilometrajeActual = maintenance.kilometraje_actual || maintenance.kilometraje; // Usar el de la moto si está disponible
        const kilometrosDesdeMantenimiento = kilometrajeActual - maintenance.kilometraje;
        const kilometrosRecomendados = recommendation.kilometraje_recomendado;

        let ahorroEstimado = 0;
        let kilometrajeAhorrado = 0;
        let detalles = '';

        if (kilometrosDesdeMantenimiento > kilometrosRecomendados) {
            // El usuario ha extendido el mantenimiento más allá de lo recomendado
            kilometrajeAhorrado = kilometrosDesdeMantenimiento - kilometrosRecomendados;
            const costoPorKilometro = recommendation.costo_estimado / kilometrosRecomendados;
            ahorroEstimado = kilometrajeAhorrado * costoPorKilometro;

            detalles = `Extendió ${kilometrajeAhorrado}km beyond ${kilometrosRecomendados}km recomendados desde el último mantenimiento`;
        } else {
            // Aún no ha alcanzado el kilometraje recomendado
            const kilometrosRestantes = kilometrosRecomendados - kilometrosDesdeMantenimiento;
            detalles = `Te quedan ${kilometrosRestantes}km para el próximo mantenimiento recomendado`;
        }

        return {
            tipo_mantenimiento: tipo,
            ahorro_estimado: parseFloat(ahorroEstimado.toFixed(2)),
            kilometraje_ahorrado: kilometrajeAhorrado,
            detalles: detalles,
            mantenimientos_realizados: [maintenance]
        };
    }

    private groupMaintenancesByType(maintenances: any[]): { [key: string]: any[] } {
        return maintenances.reduce((groups, maintenance) => {
            const tipo = maintenance.tipo;

            if (!tipo || tipo === 'undefined') {
                this.logger.warn(`Mantenimiento ${maintenance.id} sin tipo definido`);
                return groups;
            }

            if (!groups[tipo]) {
                groups[tipo] = [];
            }
            groups[tipo].push(maintenance);
            return groups;
        }, {});
    }

    private calculateSavingsForType(tipo: string, mantenimientos: any[], recommendation: any): SavingsEstimate {
        const sortedMaintenances = [...mantenimientos].sort((a, b) =>
            new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );

        let totalSavings = 0;
        let totalKilometrajeAhorrado = 0;
        const detalles: string[] = [];

        for (let i = 0; i < sortedMaintenances.length - 1; i++) {
            const current = sortedMaintenances[i];
            const previous = sortedMaintenances[i + 1];

            const kilometrosRecorridos = current.kilometraje - previous.kilometraje;
            const kilometrosRecomendados = recommendation.kilometraje_recomendado;

            if (kilometrosRecorridos > kilometrosRecomendados) {
                const kilometrosExtendidos = kilometrosRecorridos - kilometrosRecomendados;
                const costoPorKilometro = recommendation.costo_estimado / kilometrosRecomendados;
                const ahorro = kilometrosExtendidos * costoPorKilometro;

                totalSavings += ahorro;
                totalKilometrajeAhorrado += kilometrosExtendidos;

                detalles.push(
                    `Extendió ${kilometrosExtendidos}km beyond ${kilometrosRecomendados}km recomendados (${previous.fecha} → ${current.fecha})`
                );
            }
        }

        return {
            tipo_mantenimiento: tipo,
            ahorro_estimado: parseFloat(totalSavings.toFixed(2)),
            kilometraje_ahorrado: totalKilometrajeAhorrado,
            detalles: detalles.join('; '),
            mantenimientos_realizados: sortedMaintenances
        };
    }

    private calculateTotalSavings(savings: SavingsEstimate[]): number {
        return parseFloat(savings.reduce((total, estimate) => total + estimate.ahorro_estimado, 0).toFixed(2));
    }

    private generateSummary(savings: SavingsEstimate[]): any {
        const tiposConAhorro = savings.filter(s => s.ahorro_estimado > 0);
        const mayorAhorro = tiposConAhorro.length > 0
            ? tiposConAhorro.reduce((max, current) =>
                current.ahorro_estimado > max.ahorro_estimado ? current : max
            )
            : null;

        return {
            total_tipos_con_ahorro: tiposConAhorro.length,
            mayor_ahorro: mayorAhorro ? {
                tipo: mayorAhorro.tipo_mantenimiento,
                monto: mayorAhorro.ahorro_estimado
            } : null,
            recomendacion: this.generateRecommendation(savings)
        };
    }

    private generateRecommendation(savings: SavingsEstimate[]): string {
        const sinAhorro = savings.filter(s => s.ahorro_estimado === 0);
        const conAhorro = savings.filter(s => s.ahorro_estimado > 0);

        if (conAhorro.length === 0 && sinAhorro.length === 0) {
            return 'Registra más mantenimientos para obtener estimaciones de ahorro';
        }

        if (conAhorro.length === 0 && sinAhorro.length > 0) {
            const tipos = sinAhorro.map(s => s.tipo_mantenimiento);
            return `Sigue al día con los mantenimientos. Considera extender intervalos para: ${tipos.join(', ')}`;
        }

        if (conAhorro.length > 0) {
            return 'Buen trabajo optimizando tus mantenimientos';
        }

        return 'Continúa con el mantenimiento preventivo';
    }
}
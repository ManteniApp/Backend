/* eslint-disable prettier/prettier */
export interface SavingsEstimate {
  tipo_mantenimiento: string;
  ahorro_estimado: number;
  kilometraje_ahorrado: number;
  detalles: string;
  mantenimientos_realizados: any[];
}

export interface SavingsResponse {
  moto_id: number;
  marca: string;
  modelo: string;
  kilometraje_actual: number;
  total_mantenimientos: number;
  ahorro_total: number;
  estimaciones: SavingsEstimate[];
  resumen: {
    total_tipos_con_ahorro: number;
    mayor_ahorro: {
      tipo: string;
      monto: number;
    } | null;
    recomendacion: string;
  };
}

export type MaintenanceRow = {
  id: number;
  moto_id: number;
  tipo_mantenimiento: string;  
  descripcion: string;
  fecha: Date;
  kilometraje: number;         
  costo: number;
  created_at: Date;
};

export interface SavingsHistoryResponse {
  historial: any[];
  mensaje: string;
}
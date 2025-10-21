/* eslint-disable prettier/prettier */
export interface Maintenance {
  id: number;
  moto_id: number;
  fecha: Date;
  tipo: string;
  descripcion?: string;
  kilometraje?: number;
  costo?: number;
}

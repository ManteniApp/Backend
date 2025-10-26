/* eslint-disable prettier/prettier */
export interface UserRow {
  id: number;
  nombre: string;
  telefono: string;
  email: string;
  password_hash?: string;
  google_id?: string;
  fecha_registro: Date;
}
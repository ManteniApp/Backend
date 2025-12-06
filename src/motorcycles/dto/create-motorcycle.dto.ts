/* eslint-disable prettier/prettier */
import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateMotorcycleDto {
  readonly marca: string;
  readonly modelo: string;
  readonly placa: string;
  readonly cilindraje: string;
  readonly anio: number;
  readonly usuarioId: number;
  @IsOptional()
  @IsBoolean()
  readonly buscarImagen?: boolean = true; // Nuevo campo
}

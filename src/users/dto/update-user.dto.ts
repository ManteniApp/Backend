/* eslint-disable prettier/prettier */
import { 
  IsOptional, 
  IsString, 
  IsEmail, 
  MinLength, 
  MaxLength, 
  Matches,
  ValidateIf,
  IsNotEmpty
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El nombre no puede tener más de 100 caracteres' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, { 
    message: 'El nombre solo puede contener letras y espacios' 
  })
  nombre?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @MaxLength(255, { message: 'El email no puede tener más de 255 caracteres' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @Matches(/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/, { 
    message: 'El teléfono debe tener un formato válido' 
  })
  @MaxLength(20, { message: 'El teléfono no puede tener más de 20 caracteres' })
  telefono?: string;

  @IsOptional()
  @IsString({ message: 'La contraseña actual debe ser una cadena de texto' })
  @ValidateIf(o => o.newPassword) // Solo validar si newPassword está presente
  @IsNotEmpty({ message: 'La contraseña actual es requerida cuando se cambia la contraseña' })
  currentPassword?: string;

  @IsOptional()
  @IsString({ message: 'La nueva contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La nueva contraseña debe tener al menos 6 caracteres' })
  @MaxLength(100, { message: 'La nueva contraseña no puede tener más de 100 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { 
    message: 'La nueva contraseña debe contener al menos una mayúscula, una minúscula y un número' 
  })
  newPassword?: string;
}
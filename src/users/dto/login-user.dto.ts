/* eslint-disable prettier/prettier */
import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({ example: 'usuario@ejemplo.com', description: 'Email del usuario' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'Contraseña del usuario' })
  @IsNotEmpty()
  password: string;
}

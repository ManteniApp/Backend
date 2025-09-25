/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../dto/create-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';

@Injectable()
export class UsersService {
  constructor(
    // Aquí inyectas el repositorio o el acceso a la DB
  ) {}

  async registerWithEmail(dto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    // Guardar en la DB nombre, email, telefono, password_hash
  }

  async loginWithEmail(dto: LoginUserDto) {
    // Buscar usuario por email
    // Comparar password con bcrypt.compare
    // Retornar JWT o error
  }

  async registerWithGoogle(googleData: { email: string; nombre: string; googleId: string }) {
    // Buscar si ya existe
    // Si no existe, registrar con google_id
  }

  async findById(id: number) {
    // Buscar usuario por ID
  }

  async deleteUser(id: number) {
    // Eliminar usuario
  }
}

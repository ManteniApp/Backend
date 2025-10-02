/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { UsersService } from '../service/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  async register(@Body() body: { nombre: string; email: string; password: string; telefono?: string }) {
    return this.usersService.registerWithEmail(body.nombre, body.email, body.password, body.telefono);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.usersService.loginWithEmail(body.email, body.password);
  }

  @Post('google')
  async loginGoogle(@Body() body: { idToken: string }) {
    return this.usersService.registerOrLoginWithGoogle(body.idToken);
  }

  @Post('password/forgot')
  async forgot(@Body() body: { email: string }, @Query('frontendUrl') frontendUrl?: string) {
    // Option: pass frontendUrl as query param, or use env FRONTEND_URL in service
    const front = frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
    return this.usersService.requestPasswordReset(body.email, front);
  }

  @Post('password/reset')
  async reset(@Body() body: { token: string; newPassword: string }) {
    return this.usersService.resetPassword(body.token, body.newPassword);
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.usersService.findById(Number(id));
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(Number(id));
  }
}

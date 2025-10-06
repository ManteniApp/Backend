/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Body, Controller, Delete, Get, Param, Post, Query, Req } from '@nestjs/common';
import { UsersService } from '../service/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';


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


  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('password/forgot')
  async forgot(@Body() body: { email: string }, @Req() req, @Query('frontendUrl') frontendUrl?: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip;
    const front = frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
    return this.usersService.requestPasswordReset(body.email, front, ip);
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

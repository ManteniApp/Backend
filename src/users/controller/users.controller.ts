/* eslint-disable prettier/prettier */
import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { UsersService } from '../service/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  registerWithEmail(@Body() dto: CreateUserDto) {
    return this.usersService.registerWithEmail(dto);
  }

  @Post('login')
  loginWithEmail(@Body() dto: LoginUserDto) {
    return this.usersService.loginWithEmail(dto);
  }

  @Get(':id')
  getUser(@Param('id') id: number) {
    return this.usersService.findById(id);
  }

  @Delete(':id')
  deleteUser(@Param('id') id: number) {
    return this.usersService.deleteUser(id);
  }
}

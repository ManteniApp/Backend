/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Body, Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { MotorcycleSpecsService } from '../service/motorcycle-specs.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('motorcycle-specs')
export class MotorcycleSpecsController {
  constructor(private readonly motorcycleSpecsService: MotorcycleSpecsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll() {
    return this.motorcycleSpecsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() body: {
    marca: string;
    modelo: string;
    cilindraje?: number;
    tipo?: string;
    potencia?: string;
    combustible?: string;
    transmision?: string;
    peso?: string;
  }) {
    return this.motorcycleSpecsService.create(body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id') id: number) {
    return this.motorcycleSpecsService.deleteById(id);
  }
}

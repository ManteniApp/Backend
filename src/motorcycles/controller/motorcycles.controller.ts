/* eslint-disable prettier/prettier */

import { Body, Controller, Post, Get, UseGuards, Patch, Delete, Param, Req } from '@nestjs/common'; // 👈 Agregamos Patch, Delete y Req ya estaba
import { MotorcyclesService } from '../service/motorcycles.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import express from 'express';

@ApiTags('Motocicletas')
@ApiBearerAuth()
@Controller('motorcycles')
export class MotorcyclesController {
  constructor(private readonly motorcyclesService: MotorcyclesService) { }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(
    @Body() body: {
      marca: string;
      modelo: string;
      placa: string;
      anio?: number;
      kilometraje?: number;
    },
    @Req() req: express.Request,
  ) {
    const user = req.user as { id: number };

    return this.motorcyclesService.createMotorcycle({
      cliente_id: user.id,
      ...body,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Req() req: express.Request) {
    const user = req.user as { id: number };
    return this.motorcyclesService.findAllByUserId(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('placa/:placa')
  async findByPlaca(
    @Param('placa') placa: string,
    @Req() req: express.Request
  ) {
    const user = req.user as { id: number };
    return this.motorcyclesService.findByPlaca(placa, user.id);
  }

  // 👈 NUEVO: Ruta para editar (actualizar) una moto por ID
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updates: Partial<{ // 👈 Parcial para permitir actualizaciones selectivas
      marca: string;
      modelo: string;
      placa: string;
      anio?: number;
      kilometraje?: number;
    }>,
    @Req() req: express.Request,
  ) {
    const user = req.user as { id: number };
    return this.motorcyclesService.updateMotorcycle(+id, updates, user.id); // 👈 +id para convertir a number
  }

  // 👈 NUEVO: Ruta para eliminar una moto por ID
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @Req() req: express.Request,
  ) {
    const user = req.user as { id: number };
    return this.motorcyclesService.deleteMotorcycle(+id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('specs')
  async getSpecifications(
    @Body() body: { marca: string; modelo: string },
  ) {
    return this.motorcyclesService.getMotorcycleSpecs(body.marca, body.modelo);
  }

  @UseGuards(JwtAuthGuard)
  @Get('specs/all')
  async getAllSpecs() {
    return this.motorcyclesService.getAllSpecs();
  }

}
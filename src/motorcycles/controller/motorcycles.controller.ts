/* eslint-disable prettier/prettier */

import { Body, Controller, Post,Get, UseGuards } from '@nestjs/common';
import { MotorcyclesService } from '../service/motorcycles.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'; // 👈 importa tu guard aquí
import express from 'express';
import { Req } from '@nestjs/common/decorators';

//import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';

@Controller('motorcycles')
export class MotorcyclesController {
  constructor(private readonly motorcyclesService: MotorcyclesService) {}
  
  
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
    // El id del usuario autenticado se obtiene del token
    const user = req.user as { id: number };

    return this.motorcyclesService.createMotorcycle({
      cliente_id: user.id, // 👈 relaciona la moto con el usuario autenticado
      ...body,
    });
  }
  
  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Req() req: express.Request) {
    const user = req.user as { id: number }; // El req.user es poblado por el JwtAuthGuard, donde obtenemos el id por el token mediante el JwtStrategy
    return this.motorcyclesService.findAllByUserId(user.id);
  }

}

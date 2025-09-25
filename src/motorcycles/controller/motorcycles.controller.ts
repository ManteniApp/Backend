import { Controller, Get, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';

@Controller('motorcycles')
export class MotorcyclesController {
  @Get()
  @UseGuards(FirebaseAuthGuard)
  findAll() {
    return [{ id: 1, brand: 'Yamaha', model: 'R3' }];
  }
}
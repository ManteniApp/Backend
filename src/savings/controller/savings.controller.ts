/* eslint-disable prettier/prettier */
import { Controller, Post, Get, UseGuards, Param, Req } from '@nestjs/common';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SavingsResponse, SavingsHistoryResponse } from '../interfaces/savings.interface';
import { SavingsService } from '../service/savings.service';

@Controller('savings')
export class SavingsController {
  constructor(private readonly savingsService: SavingsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('calculate/motorcycle/:moto_id')
  async calculateSavingsByMotorcycle(
    @Param('moto_id') moto_id: string,
    @Req() req: any,
  ): Promise<SavingsResponse> {
    const user = req.user as { id: number };
    return this.savingsService.calculateSavingsByMotorcycle(+moto_id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  async getSavingsHistory(@Req() req: any): Promise<SavingsHistoryResponse> {
    const user = req.user as { id: number };
    return this.savingsService.getSavingsHistory(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('motorcycle/:moto_id')
  async getMotorcycleSavings(
    @Param('moto_id') moto_id: string,
    @Req() req: any,
  ): Promise<SavingsResponse> {
    const user = req.user as { id: number };
    return this.savingsService.calculateSavingsByMotorcycle(+moto_id, user.id);
  }
}
/* eslint-disable prettier/prettier */

// src/database/database.controller.ts
import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Controller('database')
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get('test')
  async testConnection() {
    const result = await this.databaseService.getData();
    return { success: true, result };
  }
}

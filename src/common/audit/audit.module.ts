/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { DatabaseService } from '../../infrastructure/database/database.service';

@Module({
  providers: [AuditService, DatabaseService],
  exports: [AuditService],
})
export class AuditModule {}

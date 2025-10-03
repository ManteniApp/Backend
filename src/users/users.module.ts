/* eslint-disable prettier/prettier */
// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { UsersController } from './controller/users.controller';
import { UsersService } from './service/users.service';
import { UsersRepository } from './repository/users.repository';
import { PasswordResetRepository } from './repository/password-reset.repository';
import { AuthModule } from '../auth/auth.module';
import { MailService } from '../common/mail/mail.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { NotificationsModule } from '../notifications/notifications.module'; 

@Module({
  imports: [AuthModule, ConfigModule, DatabaseModule, NotificationsModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, PasswordResetRepository, MailService],
  exports: [UsersService],
})
export class UsersModule {}

/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MotorcyclesModule } from './motorcycles/motorcycles.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { DatabaseModule } from './infrastructure/database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 👈 permite usar ConfigService en toda la app
    }),
    UsersModule,
    AuthModule,
    MotorcyclesModule,
    MaintenanceModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

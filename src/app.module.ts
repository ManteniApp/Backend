/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MotorcyclesModule } from './motorcycles/motorcycles.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { RecommendationsModule } from './recomendations/recomendations.module'
import { MaintenanceSummaryModule } from './maintenance-sumary/maintenance-summary.module';
import { SavingsModule } from './savings/savings.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 👈 permite usar ConfigService en toda la app
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
    UsersModule,
    AuthModule,
    MotorcyclesModule,
    MaintenanceModule,
    RecommendationsModule,
    MaintenanceSummaryModule,
    SavingsModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    }
  ],
})
export class AppModule {}

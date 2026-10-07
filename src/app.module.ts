import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HospitalsModule } from './modules/hospitals/hospitals.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { AdminModule } from './modules/admin/admin.module';
import { DonationsModule } from './modules/donations/donations.module';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    HospitalsModule,
    AlertsModule,
    AdminModule,
    DonationsModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
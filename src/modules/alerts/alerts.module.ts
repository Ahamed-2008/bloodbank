import { Module } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { AlertsExpiryService } from './alerts-expiry.service';

@Module({
  controllers: [AlertsController],
  providers: [AlertsService, AlertsExpiryService],
  exports: [AlertsService],
})
export class AlertsModule {}
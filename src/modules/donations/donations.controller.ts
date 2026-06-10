import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    Request,
    UseGuards,
    HttpCode,
    HttpStatus,
  } from '@nestjs/common';
  import { DonationsService } from './donations.service';
  import { JwtAuthGuard } from '../auth/jwt-auth.guard';
  import { RolesGuard } from '../../common/guards/roles.guard';
  import { Roles } from '../../common/decorators/roles.decorator';
  import { AcceptAlertDto } from './donations.dto';
  
  @Controller('donations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('donor')
  export class DonationsController {
    constructor(private readonly donationsService: DonationsService) {}
  
    @Get('active')
    getActiveAlerts(@Request() req) {
      return this.donationsService.getActiveAlertsForDonor(req.user.userId);
    }
  
    @Get('history')
    getDonationHistory(@Request() req) {
      return this.donationsService.getDonationHistory(req.user.userId);
    }
  
    @Get('stats')
    getDonorStats(@Request() req) {
      return this.donationsService.getDonorStats(req.user.userId);
    }
  
    @Post(':alertId/accept')
    @HttpCode(HttpStatus.OK)
    acceptAlert(
      @Request() req,
      @Param('alertId') alertId: string,
      @Body() dto: AcceptAlertDto,
    ) {
      return this.donationsService.acceptAlert(req.user.userId, alertId, dto);
    }
  
    @Post(':alertId/decline')
    @HttpCode(HttpStatus.OK)
    declineAlert(@Request() req, @Param('alertId') alertId: string) {
      return this.donationsService.declineAlert(req.user.userId, alertId);
    }
  
    @Put(':alertId/arrived')
    @HttpCode(HttpStatus.OK)
    markArrived(@Request() req, @Param('alertId') alertId: string) {
      return this.donationsService.markArrived(req.user.userId, alertId);
    }
  }
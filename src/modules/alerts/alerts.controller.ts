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
  import { AlertsService } from './alerts.service';
  import { JwtAuthGuard } from '../auth/jwt-auth.guard';
  import { RolesGuard } from '../../common/guards/roles.guard';
  import { Roles } from '../../common/decorators/roles.decorator';
  import { CreateAlertDto, CancelAlertDto } from './alerts.dto';
  
  @Controller('alerts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  export class AlertsController {
    constructor(private readonly alertsService: AlertsService) {}
  
    // Hospital staff only
    @Post()
    @Roles('hospital_staff')
    @HttpCode(HttpStatus.CREATED)
    createAlert(@Request() req, @Body() dto: CreateAlertDto) {
      return this.alertsService.createAlert(
        req.user.hospitalId,
        req.user.userId,
        dto,
      );
    }
  
    // Hospital staff only
    @Get('hospital')
    @Roles('hospital_staff')
    getHospitalAlerts(@Request() req) {
      return this.alertsService.getHospitalAlerts(req.user.hospitalId);
    }
  
    // Public — donors need to see alert details
    @Get(':id')
    getAlertById(@Param('id') id: string) {
      return this.alertsService.getAlertById(id);
    }
  
    // Hospital staff only
    @Get(':id/responses')
    @Roles('hospital_staff')
    getAlertResponses(@Request() req, @Param('id') id: string) {
      return this.alertsService.getAlertResponses(id, req.user.hospitalId);
    }
  
    // Hospital staff only
    @Put(':id/confirm/:responseId')
    @Roles('hospital_staff')
    @HttpCode(HttpStatus.OK)
    confirmDonation(
      @Request() req,
      @Param('id') id: string,
      @Param('responseId') responseId: string,
    ) {
      return this.alertsService.confirmDonation(id, responseId, req.user.hospitalId);
    }
  
    // Hospital staff only
    @Put(':id/cancel')
    @Roles('hospital_staff')
    @HttpCode(HttpStatus.OK)
    cancelAlert(
      @Request() req,
      @Param('id') id: string,
      @Body() dto: CancelAlertDto,
    ) {
      return this.alertsService.cancelAlert(id, req.user.hospitalId, dto);
    }
  }
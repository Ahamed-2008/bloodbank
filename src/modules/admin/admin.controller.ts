import {
    Controller,
    Get,
    Put,
    Body,
    Param,
    Query,
    Request,
    UseGuards,
    HttpCode,
    HttpStatus,
  } from '@nestjs/common';
  import { AdminService } from './admin.service';
  import { JwtAuthGuard } from '../auth/jwt-auth.guard';
  import { RolesGuard } from '../../common/guards/roles.guard';
  import { Roles } from '../../common/decorators/roles.decorator';
  import {
    ListHospitalsQueryDto,
    ListDonorsQueryDto,
    RejectHospitalDto,
    RejectDonorDto,
    VerificationStatus,
  } from './admin.dto';
  import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
  
  @Controller('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiTags('Admin')
  @ApiBearerAuth()
  export class AdminController {
    constructor(private readonly adminService: AdminService) {}
  
    @Get('dashboard')
    getDashboardStats() {
      return this.adminService.getDashboardStats();
    }
  
    @Get('hospitals')
    @ApiQuery({ name: 'status', required: false, enum: VerificationStatus })
    getHospitals(@Query() query: ListHospitalsQueryDto) {
      return this.adminService.getHospitals(query.status);
    }
  
    @Get('hospitals/:id')
    getHospitalById(@Param('id') id: string) {
      return this.adminService.getHospitalById(id);
    }
  
    @Put('hospitals/:id/approve')
    @HttpCode(HttpStatus.OK)
    approveHospital(@Request() req, @Param('id') id: string) {
      return this.adminService.approveHospital(id, req.user.userId);
    }
  
    @Put('hospitals/:id/reject')
    @HttpCode(HttpStatus.OK)
    rejectHospital(
      @Request() req,
      @Param('id') id: string,
      @Body() dto: RejectHospitalDto,
    ) {
      return this.adminService.rejectHospital(id, req.user.userId, dto);
    }
  
    @Get('donors')
    @ApiQuery({ name: 'verified', required: false, enum: ['true', 'false'] })
    getDonors(@Query() query: ListDonorsQueryDto) {
      const verified = query.verified === undefined ? undefined : query.verified === 'true';
      return this.adminService.getDonors(verified);
    }

    @Put('donors/:id/approve')
    @HttpCode(HttpStatus.OK)
    approveDonor(@Request() req, @Param('id') id: string) {
      return this.adminService.approveDonor(id, req.user.userId);
    }

    @Put('donors/:id/reject')
    @HttpCode(HttpStatus.OK)
    rejectDonor(
      @Request() req,
      @Param('id') id: string,
      @Body() dto: RejectDonorDto,
    ) {
      return this.adminService.rejectDonor(id, req.user.userId, dto);
    }
  
    @Get('alerts')
    getActiveAlerts() {
      return this.adminService.getActiveAlerts();
    }
  }
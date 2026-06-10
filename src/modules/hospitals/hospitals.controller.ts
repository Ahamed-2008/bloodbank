import {
    Controller,
    Get,
    Post,
    Body,
    Request,
    UseGuards,
    HttpCode,
    HttpStatus,
  } from '@nestjs/common';
  import { HospitalsService } from './hospitals.service';
  import { JwtAuthGuard } from '../auth/jwt-auth.guard';
  import { RolesGuard } from '../../common/guards/roles.guard';
  import { Roles } from '../../common/decorators/roles.decorator';
  import { RegisterHospitalDto, AddStaffDto } from './hospitals.dto';
  
  @Controller('hospitals')
  export class HospitalsController {
    constructor(private readonly hospitalsService: HospitalsService) {}
  
    // Public — no JWT required
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    registerHospital(@Body() dto: RegisterHospitalDto) {
      return this.hospitalsService.registerHospital(dto);
    }
  
    // Hospital staff — JWT required
    @Get('profile')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('hospital_staff')
    getProfile(@Request() req) {
      return this.hospitalsService.getHospitalProfile(req.user.hospitalId);
    }
  
    @Post('staff')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('hospital_staff')
    @HttpCode(HttpStatus.CREATED)
    addStaff(@Request() req, @Body() dto: AddStaffDto) {
      return this.hospitalsService.addStaff(
        req.user.hospitalId,
        req.user.staffRole,
        dto,
      );
    }
  
    @Get('staff')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('hospital_staff')
    getStaff(@Request() req) {
      return this.hospitalsService.getStaff(req.user.hospitalId);
    }
  }
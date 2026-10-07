import {
    Controller,
    Get,
    Put,
    Body,
    Request,
    UseGuards,
    HttpCode,
    HttpStatus,
  } from '@nestjs/common';
  import { UsersService } from './users.service';
  import { JwtAuthGuard } from '../auth/jwt-auth.guard';
  import { RolesGuard } from '../../common/guards/roles.guard';
  import { Roles } from '../../common/decorators/roles.decorator';
  import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
  import {
    CompleteProfileDto,
    UpdateLocationDto,
    UpdateNotificationPrefsDto,
    UpdateAvailabilityDto,
  } from './users.dto';
  
  @Controller('users')
  @UseGuards(JwtAuthGuard)  // All routes in this controller require JWT
  @ApiTags('Users')
  @ApiBearerAuth()
  export class UsersController {
    constructor(private readonly usersService: UsersService) {}
  
    @Get('profile')
    getProfile(@Request() req) {
      return this.usersService.getProfile(req.user.userId);
    }
  
    @Put('profile')
    @HttpCode(HttpStatus.OK)
    completeProfile(@Request() req, @Body() dto: CompleteProfileDto) {
      return this.usersService.completeProfile(req.user.userId, dto);
    }
  
    @Put('location')
    @HttpCode(HttpStatus.OK)
    updateLocation(@Request() req, @Body() dto: UpdateLocationDto) {
      return this.usersService.updateLocation(req.user.userId, dto);
    }
  
    @Get('eligibility')
    getEligibility(@Request() req) {
      return this.usersService.getEligibility(req.user.userId);
    }
  
    @Put('notifications')
    @HttpCode(HttpStatus.OK)
    updateNotificationPrefs(
      @Request() req,
      @Body() dto: UpdateNotificationPrefsDto,
    ) {
      return this.usersService.updateNotificationPrefs(req.user.userId, dto);
    }

    @Put('availability')
    @UseGuards(RolesGuard)
    @Roles('donor')
    @HttpCode(HttpStatus.OK)
    updateAvailability(@Request() req, @Body() dto: UpdateAvailabilityDto) {
      return this.usersService.updateAvailability(req.user.userId, dto);
    }
  }
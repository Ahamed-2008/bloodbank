import { Transform } from 'class-transformer';
  import {
    IsString,
    IsEnum,
    IsDateString,
    IsNumber,
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    Min,
    Max,
    Length,
    IsLatitude,
    IsLongitude,
  } from 'class-validator';
  
  export enum BloodGroup {
    A_POS = 'A+',
    A_NEG = 'A-',
    B_POS = 'B+',
    B_NEG = 'B-',
    AB_POS = 'AB+',
    AB_NEG = 'AB-',
    O_POS = 'O+',
    O_NEG = 'O-',
  }
  
  export enum Gender {
    MALE = 'Male',
    FEMALE = 'Female',
    OTHER = 'Other',
  }
  
  export class CompleteProfileDto {
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsString()
    @IsNotEmpty()
    @Length(2, 100)
    name: string;
  
    @IsEnum(BloodGroup)
    blood_group: BloodGroup;
  
    @IsDateString()
    date_of_birth: string;
  
    @IsEnum(Gender)
    gender: Gender;
  }
  
  export class UpdateLocationDto {
    @IsLatitude()
    latitude: number;
  
    @IsLongitude()
    longitude: number;
  
    @IsString()
    @IsNotEmpty()
    @Length(6, 6)
    pincode: string;
  
    @IsOptional()
    @IsString()
    city?: string;
  
    @IsOptional()
    @IsString()
    state?: string;
  }
  
  export class UpdateNotificationPrefsDto {
    @IsBoolean()
    notifications_enabled: boolean;
  
    @IsNumber()
    @Min(1)
    @Max(50)
    max_alert_radius_km: number;
  }

  export class UpdateAvailabilityDto {
    @IsBoolean()
    is_available: boolean;
  }
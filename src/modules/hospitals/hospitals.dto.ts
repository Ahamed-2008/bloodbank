import {
    IsString,
    IsEnum,
    IsEmail,
    IsDateString,
    IsLatitude,
    IsLongitude,
    IsPhoneNumber,
    IsUUID,
    IsOptional,
    Length,
  } from 'class-validator';
  
  export enum HospitalType {
    GOVERNMENT = 'Government',
    PRIVATE = 'Private',
    TRUST = 'Trust',
    CLINIC = 'Clinic',
  }
  
  export enum StaffRole {
    ADMIN = 'Admin',
    OPERATOR = 'Operator',
  }
  
  export class RegisterHospitalDto {
    @IsString()
    @Length(2, 200)
    name: string;
  
    @IsString()
    @Length(2, 100)
    registration_number: string;
  
    @IsEnum(HospitalType)
    hospital_type: HospitalType;
  
    @IsString()
    @Length(2, 100)
    contact_name: string;
  
    @IsPhoneNumber('IN')
    contact_phone: string;
  
    @IsEmail()
    contact_email: string;
  
    @IsLatitude()
    latitude: number;
  
    @IsLongitude()
    longitude: number;
  
    @IsString()
    address: string;
  
    @IsString()
    @Length(6, 10)
    pincode: string;
  
    @IsString()
    city: string;
  
    @IsString()
    state: string;
  
    @IsString()
    license_number: string;
  
    @IsDateString()
    license_issued_at: string;
  
    @IsDateString()
    license_expires_at: string;
  }
  
  export class AddStaffDto {
    @IsString()
    @Length(2, 100)
    name: string;
  
    @IsPhoneNumber('IN')
    phone: string;
  
    @IsOptional()
    @IsEmail()
    email?: string;
  
    @IsEnum(StaffRole)
    role: StaffRole;
  }
  
  export class RejectHospitalDto {
    @IsString()
    @Length(10, 500)
    reason: string;
  }
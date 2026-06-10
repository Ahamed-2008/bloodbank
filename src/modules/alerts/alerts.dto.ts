import {
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    IsBoolean,
    Min,
    Max,
    Length,
  } from 'class-validator';
  
  export enum UrgencyLevel {
    CRITICAL = 'Critical',
    HIGH = 'High',
    NORMAL = 'Normal',
  }
  
  export enum DepartmentType {
    EMERGENCY = 'Emergency',
    ICU = 'ICU',
    OT = 'OT',
    GENERAL_WARD = 'GeneralWard',
    LABOUR_ROOM = 'LabourRoom',
    BLOOD_BANK = 'BloodBank',
    OTHER = 'Other',
  }
  
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
  
  export class CreateAlertDto {
    @IsEnum(BloodGroup)
    blood_group: BloodGroup;
  
    @IsInt()
    @Min(1)
    @Max(10)
    units_needed: number;
  
    @IsEnum(UrgencyLevel)
    urgency: UrgencyLevel;
  
    @IsEnum(DepartmentType)
    department: DepartmentType;
  
    @IsOptional()
    @IsString()
    @Length(1, 50)
    patient_ref?: string;
  
    @IsOptional()
    @IsString()
    @Length(1, 500)
    patient_condition?: string;
  
    @IsOptional()
    @IsBoolean()
    auto_expand_radius?: boolean;
  
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(50)
    radius_km?: number;
  }
  
  export class CancelAlertDto {
    @IsString()
    @Length(5, 500)
    cancellation_reason: string;
  }
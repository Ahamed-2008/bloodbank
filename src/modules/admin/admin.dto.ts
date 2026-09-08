import { IsEnum, IsString, IsOptional, Length } from 'class-validator';

export enum VerificationStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

export class ListHospitalsQueryDto {
  @IsOptional()
  @IsEnum(VerificationStatus)
  status?: VerificationStatus;
}

export class RejectHospitalDto {
  @IsString()
  @Length(10, 500)
  reason: string;
}

export class RejectDonorDto {
  @IsString()
  @Length(10, 500)
  reason: string;
}
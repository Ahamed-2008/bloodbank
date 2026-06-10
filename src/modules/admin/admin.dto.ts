import { IsString, IsOptional, Length } from 'class-validator';

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
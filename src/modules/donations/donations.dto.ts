import { IsInt, IsOptional, Min, Max } from 'class-validator';

export class AcceptAlertDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  eta_minutes?: number;
}
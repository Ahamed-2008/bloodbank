import { IsNotEmpty, IsString } from 'class-validator';

export class DemoSignInDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}

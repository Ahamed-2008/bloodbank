import { IsString, IsPhoneNumber, IsNumberString, Length } from 'class-validator';

export class SendOtpDto {
  @IsString()
  @IsPhoneNumber('IN')
  phone: string;
}

export class VerifyOtpDto {
  @IsString()
  @IsPhoneNumber('IN')
  phone: string;

  @IsNumberString()
  @Length(6, 6)
  otp: string;
}
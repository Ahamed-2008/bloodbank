import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { VerifyIdTokenDto } from './auth.dto';
import { ApiTags } from '@nestjs/swagger';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Firebase Phone Auth flow:
  // the client verifies the user's phone number in Firebase, receives a Firebase ID
  // token, and then calls this endpoint to exchange that token for the backend JWT.
  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  signIn(@Body() dto: VerifyIdTokenDto) {
    return this.authService.signInWithFirebaseToken(dto.idToken);
  }
}
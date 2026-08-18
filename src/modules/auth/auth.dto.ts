import { IsString } from 'class-validator';

/**
 * Firebase Phone Auth payload:
 * the client submits a Firebase ID token that has already been verified by Firebase.
 */
export class VerifyIdTokenDto {
  @IsString()
  idToken: string;
}
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import * as admin from 'firebase-admin';
import { resolve } from 'node:path';

// Initialize firebase-admin when this module is loaded for Firebase Phone Auth
// token verification. Supports either GOOGLE_APPLICATION_CREDENTIALS (file path)
// or FIREBASE_SERVICE_ACCOUNT_KEY (base64 JSON).
function initializeFirebase(configService: ConfigService) {
  if (admin.apps && admin.apps.length > 0) return;

  const gacPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS');
  const svcKeyBase64 = configService.get<string>('FIREBASE_SERVICE_ACCOUNT_KEY');

  if (gacPath) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const key = require(resolve(process.cwd(), gacPath));
    admin.initializeApp({ credential: admin.credential.cert(key) });
    return;
  }

  if (svcKeyBase64) {
    const keyJson = JSON.parse(Buffer.from(svcKeyBase64, 'base64').toString());
    admin.initializeApp({ credential: admin.credential.cert(keyJson) });
    return;
  }

  throw new Error('Firebase service account not configured. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_KEY');
}

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN');
      
        if (!secret) {
          throw new Error('JWT_SECRET is not defined in environment variables.');
        }
      
        if (!expiresIn) {
          throw new Error('JWT_EXPIRES_IN is not defined in environment variables.');
        }
      
        return {
          secret,
          signOptions: { expiresIn: expiresIn as any },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      provide: 'FIREBASE_ADMIN_INITIALIZER',
      useFactory: (configService: ConfigService) => initializeFirebase(configService),
      inject: [ConfigService],
    },
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
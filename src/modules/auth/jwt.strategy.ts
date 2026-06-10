import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');

    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables.');
    }
    super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: configService.get<string>('JWT_SECRET') as string,
      });
  }

  async validate(payload: any) {
    if (!payload.sub) {
      throw new UnauthorizedException();
    }
  
    return {
      userId: payload.sub,
      phone: payload.phone,
      role: payload.role,
      hospitalId: payload.hospital_id ?? null,
      staffRole: payload.staff_role ?? null,
      adminRole: payload.admin_role ?? null,
    };
  }
}
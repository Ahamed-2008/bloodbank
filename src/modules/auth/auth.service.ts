import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as admin from 'firebase-admin';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;

  constructor(private jwtService: JwtService, private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl) throw new Error('SUPABASE_URL is not defined.');
    if (!supabaseKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined.');

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }
  // Verify Firebase ID token and issue backend JWT
  async signInWithFirebaseToken(
    idToken: string,
  ): Promise<{
    token: string;
    isNewUser: boolean;
    role: string;
  }> {
    let decoded: admin.auth.DecodedIdToken;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired Firebase ID token.');
    }

    const phone = decoded.phone_number;

    if (!phone) {
      throw new BadRequestException('Firebase ID token does not contain a phone number.');
    }

    // ── Check admins table first ──
    const { data: adminRow } = await this.supabase
      .from('admins')
      .select('admin_id, role, is_active')
      .eq('phone', phone)
      .single();

    if (adminRow) {
      if (!adminRow.is_active) {
        throw new UnauthorizedException('Your admin account has been deactivated.');
      }

      const token = this.jwtService.sign({
        sub: adminRow.admin_id,
        phone,
        role: 'admin',
        admin_role: adminRow.role,
      });

      return { token, isNewUser: false, role: 'admin' };
    }

    // ── Check hospital_staff table ──
    const { data: staffMember } = await this.supabase
      .from('hospital_staff')
      .select('staff_id, hospital_id, role, is_active')
      .eq('phone', phone)
      .single();

    if (staffMember) {
      if (!staffMember.is_active) {
        throw new UnauthorizedException('Your staff account has been deactivated.');
      }

      const token = this.jwtService.sign({
        sub: staffMember.staff_id,
        phone,
        role: 'hospital_staff',
        hospital_id: staffMember.hospital_id,
        staff_role: staffMember.role,
      });

      return { token, isNewUser: false, role: 'hospital_staff' };
    }

    // ── Check users table ──
    const { data: existingUser } = await this.supabase
      .from('users')
      .select('user_id, phone')
      .eq('phone', phone)
      .is('deleted_at', null)
      .single();

    let userId: string;
    let isNewUser = false;

    if (!existingUser) {
      // Create new donor account (default placeholder values)
      const { data: newUser, error } = await this.supabase
        .from('users')
        .insert({
          phone,
          name: '',
          blood_group: 'O+',
          date_of_birth: '2000-01-01',
          gender: 'Other',
        })
        .select('user_id')
        .single();

      if (error || !newUser) {
        throw new BadRequestException('Failed to create user account.');
      }

      userId = newUser.user_id;
      isNewUser = true;
    } else {
      userId = existingUser.user_id;
    }

    const token = this.jwtService.sign({
      sub: userId,
      phone,
      role: 'donor',
    });

    return { token, isNewUser, role: 'donor' };
  }
}
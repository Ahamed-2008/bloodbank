import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;
  private otpStore = new Map<string, { otp: string; expiresAt: Date }>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl) throw new Error('SUPABASE_URL is not defined.');
    if (!supabaseKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined.');

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // ─── Send OTP ───────────────────────────────────────────────────
  async sendOtp(phone: string): Promise<{ message: string }> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryMinutes =
      this.configService.get<number>('OTP_EXPIRY_MINUTES') || 10;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    this.otpStore.set(phone, { otp, expiresAt });

    // TODO: Replace with Twilio SMS in production
    console.log(`OTP for ${phone}: ${otp}`);

    return { message: 'OTP sent successfully' };
  }

  // ─── Verify OTP ─────────────────────────────────────────────────
  async verifyOtp(
    phone: string,
    otp: string,
  ): Promise<{
    token: string;
    isNewUser: boolean;
    role: string;
  }> {
    // Validate OTP
    const stored = this.otpStore.get(phone);

    if (!stored) {
      throw new BadRequestException('OTP not found. Please request a new one.');
    }

    if (new Date() > stored.expiresAt) {
      this.otpStore.delete(phone);
      throw new BadRequestException('OTP has expired. Please request a new one.');
    }

    if (stored.otp !== otp) {
      throw new UnauthorizedException('Invalid OTP.');
    }

    // OTP valid — delete immediately (one-time use)
    this.otpStore.delete(phone);

    // ── Check admins table first ──
    const { data: admin } = await this.supabase
      .from('admins')
      .select('admin_id, role, is_active')
      .eq('phone', phone)
      .single();

      if (admin) {
      if (!admin.is_active) {
        throw new UnauthorizedException('Your admin account has been deactivated.');
      }

      const token = this.jwtService.sign({
        sub: admin.admin_id,
        phone,
        role: 'admin',
        admin_role: admin.role,
      });

      return { token, isNewUser: false, role: 'admin' };
    }

    // ── Check hospital_staff table first ──
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
      // Create new donor account
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
import {
    Injectable,
    NotFoundException,
    BadRequestException,
  } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import { createClient, SupabaseClient } from '@supabase/supabase-js';
  import { CompleteProfileDto, UpdateLocationDto, UpdateNotificationPrefsDto } from './users.dto';
  
  @Injectable()
  export class UsersService {
    private supabase: SupabaseClient;
  
    constructor(private configService: ConfigService) {
      const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
      const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
  
      if (!supabaseUrl) throw new Error('SUPABASE_URL is not defined.');
      if (!supabaseKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined.');
  
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  
    // ─── Get Profile ───────────────────────────────────────────────
    async getProfile(userId: string) {
      const { data, error } = await this.supabase
        .from('users')
        .select(`
          user_id,
          phone,
          name,
          blood_group,
          date_of_birth,
          gender,
          is_eligible,
          last_donated_at,
          eligible_from,
          donor_score,
          tier,
          reward_points,
          aadhaar_verified,
          health_verified,
          notifications_enabled,
          max_alert_radius_km,
          created_at
        `)
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();
  
      if (error || !data) {
        throw new NotFoundException('User not found.');
      }
  
      return data;
    }
  
    // ─── Complete Profile (Onboarding) ─────────────────────────────
    async completeProfile(userId: string, dto: CompleteProfileDto) {
      // Validate age — donor must be between 18 and 65
      const dob = new Date(dto.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
  
      if (age < 18 || age > 65) {
        throw new BadRequestException('Donor must be between 18 and 65 years old.');
      }
  
      const { data, error } = await this.supabase
        .from('users')
        .update({
          name: dto.name,
          blood_group: dto.blood_group,
          date_of_birth: dto.date_of_birth,
          gender: dto.gender,
          is_eligible: true,       // eligible after profile completion
          updated_at: new Date(),
        })
        .eq('user_id', userId)
        .is('deleted_at', null)
        .select()
        .single();
  
      if (error || !data) {
        throw new BadRequestException('Failed to update profile.');
      }
  
      return data;
    }
  
    // ─── Update Location ────────────────────────────────────────────
    async updateLocation(userId: string, dto: UpdateLocationDto) {
      // Verify user exists
      const { data: user } = await this.supabase
        .from('users')
        .select('user_id')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();
  
      if (!user) throw new NotFoundException('User not found.');
  
// Check if location record already exists
      const { data: existing } = await this.supabase
        .from('user_locations')
        .select('location_id')
        .eq('user_id', userId)
        .eq('is_primary', true)
        .single();

      if (existing) {
        const { error: updateLocationError } = await this.supabase.rpc(
          'upsert_user_location',
          {
            p_user_id: userId,
            p_latitude: dto.latitude,
            p_longitude: dto.longitude,
            p_pincode: dto.pincode ?? null,
            p_city: dto.city ?? null,
            p_state: dto.state ?? null,
            p_is_primary: true,
          },
        );

        if (updateLocationError) {
          console.error('Failed to update location:', {
            code: updateLocationError.code,
            message: updateLocationError.message,
            details: updateLocationError.details,
            hint: updateLocationError.hint,
          });
          throw new BadRequestException('Failed to update location.');
        }
      } else {
        const { error: saveLocationError } = await this.supabase.rpc(
          'upsert_user_location',
          {
            p_user_id: userId,
            p_latitude: dto.latitude,
            p_longitude: dto.longitude,
            p_pincode: dto.pincode ?? null,
            p_city: dto.city ?? null,
            p_state: dto.state ?? null,
            p_is_primary: true,
          },
        );

        if (saveLocationError) {
          console.error('Failed to save location:', {
            code: saveLocationError.code,
            message: saveLocationError.message,
            details: saveLocationError.details,
            hint: saveLocationError.hint,
          });
          throw new BadRequestException('Failed to save location.');
        }
      }
  
      return { message: 'Location updated successfully.' };
    }
  
    // ─── Check Eligibility ──────────────────────────────────────────
    async getEligibility(userId: string) {
      const { data, error } = await this.supabase
        .from('users')
        .select('is_eligible, last_donated_at, eligible_from, donor_score, tier')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();
  
      if (error || !data) throw new NotFoundException('User not found.');
  
      return {
        is_eligible: data.is_eligible,
        last_donated_at: data.last_donated_at,
        eligible_from: data.eligible_from,
        donor_score: data.donor_score,
        tier: data.tier,
        days_until_eligible: data.eligible_from
          ? Math.max(
              0,
              Math.ceil(
                (new Date(data.eligible_from).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24),
              ),
            )
          : null,
      };
    }
  
    // ─── Update Notification Preferences ───────────────────────────
    async updateNotificationPrefs(
      userId: string,
      dto: UpdateNotificationPrefsDto,
    ) {
      const { error } = await this.supabase
        .from('users')
        .update({
          notifications_enabled: dto.notifications_enabled,
          max_alert_radius_km: dto.max_alert_radius_km,
          updated_at: new Date(),
        })
        .eq('user_id', userId)
        .is('deleted_at', null);
  
      if (error) throw new BadRequestException('Failed to update preferences.');
  
      return { message: 'Notification preferences updated successfully.' };
    }
  }
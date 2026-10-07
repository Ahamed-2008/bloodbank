import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
  } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import { createClient, SupabaseClient } from '@supabase/supabase-js';
  import { CreateAlertDto, CancelAlertDto } from './alerts.dto';
  import { BLOOD_GROUP_COMPATIBILITY, BloodGroup } from '../../common/constants/blood-group-compatibility';
  
  @Injectable()
  export class AlertsService {
    private supabase: SupabaseClient;
  
    constructor(private configService: ConfigService) {
      const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
      const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
  
      if (!supabaseUrl) throw new Error('SUPABASE_URL is not defined.');
      if (!supabaseKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined.');
  
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  
    // ─── Expiry duration based on urgency ──────────────────────────
    private getExpiryTime(urgency: string): Date {
      const now = Date.now();
      const durations = {
        Critical: 4 * 60 * 60 * 1000,   // 4 hours
        High:     8 * 60 * 60 * 1000,   // 8 hours
        Normal:   24 * 60 * 60 * 1000,  // 24 hours
      };
      return new Date(now + (durations[urgency] ?? durations.Normal));
    }
  
    // ─── Create Alert ───────────────────────────────────────────────
    async createAlert(
      hospitalId: string,
      staffId: string,
      dto: CreateAlertDto,
    ) {
      // Verify hospital is active and verified
      const { data: hospital } = await this.supabase
        .from('hospitals')
        .select('hospital_id, is_verified, is_active')
        .eq('hospital_id', hospitalId)
        .single();
  
      if (!hospital) {
        throw new NotFoundException('Hospital not found.');
      }
  
      if (!hospital.is_verified || !hospital.is_active) {
        throw new ForbiddenException(
          'Hospital must be verified and active to post alerts.',
        );
      }
  
      // Check if an identical active alert already exists
      // Prevents duplicate alerts for the same blood group
      const { data: duplicate } = await this.supabase
        .from('alerts')
        .select('alert_id')
        .eq('hospital_id', hospitalId)
        .eq('blood_group', dto.blood_group)
        .eq('status', 'Active')
        .single();
  
      if (duplicate) {
        throw new BadRequestException(
          `An active alert for ${dto.blood_group} blood already exists for your hospital.`,
        );
      }
  
      const { data: alert, error } = await this.supabase
        .from('alerts')
        .insert({
          hospital_id: hospitalId,
          created_by: staffId,
          blood_group: dto.blood_group,
          units_needed: dto.units_needed,
          units_fulfilled: 0,
          urgency: dto.urgency,
          department: dto.department,
          patient_ref: dto.patient_ref ?? null,
          patient_condition: dto.patient_condition ?? null,
          radius_km: dto.radius_km ?? 10,
          auto_expand_radius: dto.auto_expand_radius ?? true,
          status: 'Active',
          expires_at: this.getExpiryTime(dto.urgency),
        })
        .select()
        .gt('expires_at', new Date().toISOString())
        .single();
  
      if (error || !alert) {
        throw new BadRequestException('Failed to create alert.');
      }
  
      // TODO: Phase 1 — trigger donor notification here
      // This will be implemented in the notifications module
      await this.notifyNearbyDonors(alert.alert_id, hospitalId, dto.blood_group, dto.radius_km ?? 10);
  
      return {
        message: 'Alert posted successfully.',
        alert,
      };
    }
  
    // ─── Notify Nearby Donors ───────────────────────────────────────
    // Placeholder — full implementation in notifications module
    private async notifyNearbyDonors(
      alertId: string,
      hospitalId: string,
      bloodGroup: string,
      radiusKm: number,
    ) {
      const compatibleGroups = BLOOD_GROUP_COMPATIBILITY[bloodGroup as BloodGroup];

      // Get hospital coordinates
      const { data: hospital } = await this.supabase
        .rpc('get_hospital_coordinates', { p_hospital_id: hospitalId });
  
      // Get eligible donors within radius matching blood group
      const { data: donors } = await this.supabase
        .rpc('get_nearby_eligible_donors', {
          p_blood_group: bloodGroup,
          p_hospital_id: hospitalId,
          p_radius_km: radiusKm,
          p_compatible_groups: compatibleGroups,
          p_alert_id: alertId,
          p_limit: 100,
        });
  
      if (!donors || donors.length === 0) {
        console.log(`No eligible donors found within ${radiusKm}km for ${bloodGroup}`);
        return;
      }
  
      // Log donor IDs for now — FCM push notifications added in notifications module
      console.log(`Found ${donors.length} eligible donors for alert ${alertId}`);
  
      // Record notification entries
      const notifications = donors.map((donor: any) => ({
        alert_id: alertId,
        user_id: donor.user_id,
        delivery_status: 'Sent',
      }));
  
      await this.supabase
        .from('alert_notifications')
        .insert(notifications);
  
      // Update notified count on alert
      await this.supabase
        .from('alerts')
        .update({ notified_count: donors.length })
        .eq('alert_id', alertId);
    }
  
    // ─── Get Alert By ID ────────────────────────────────────────────
    async getAlertById(alertId: string) {
      const { data, error } = await this.supabase
        .from('alerts')
        .select(`
          alert_id,
          blood_group,
          units_needed,
          units_fulfilled,
          urgency,
          department,
          patient_ref,
          patient_condition,
          status,
          radius_km,
          notified_count,
          accepted_count,
          expires_at,
          created_at,
          hospitals (
            name,
            city,
            address
          )
        `)
        .eq('alert_id', alertId)
        .single();
  
      if (error || !data) {
        throw new NotFoundException('Alert not found.');
      }
  
      return data;
    }
  
    // ─── Get Hospital Active Alerts ─────────────────────────────────
    async getHospitalAlerts(hospitalId: string) {
      const { data, error } = await this.supabase
        .from('alerts')
        .select(`
          alert_id,
          blood_group,
          units_needed,
          units_fulfilled,
          urgency,
          department,
          patient_ref,
          status,
          notified_count,
          accepted_count,
          expires_at,
          created_at
        `)
        .eq('hospital_id', hospitalId)
        .or(`status.neq.Active,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false });
  
      if (error) throw new BadRequestException('Failed to fetch alerts.');
  
      return data;
    }
  
    // ─── Get Alert Responses ────────────────────────────────────────
    async getAlertResponses(alertId: string, hospitalId: string) {
      // Verify alert belongs to this hospital
      const { data: alert } = await this.supabase
        .from('alerts')
        .select('alert_id, hospital_id')
        .eq('alert_id', alertId)
        .eq('hospital_id', hospitalId)
        .single();
  
      if (!alert) {
        throw new ForbiddenException(
          'You do not have access to this alert.',
        );
      }
  
      const { data, error } = await this.supabase
        .from('donation_responses')
        .select(`
          response_id,
          status,
          accepted_at,
          eta_minutes,
          arrived_at,
          confirmed_at,
          users (
            name,
            blood_group,
            donor_score,
            tier
          )
        `)
        .eq('alert_id', alertId)
        .order('accepted_at', { ascending: true });
  
      if (error) throw new BadRequestException('Failed to fetch responses.');
  
      return data;
    }
  
    // ─── Confirm Donation ───────────────────────────────────────────
    async confirmDonation(
      alertId: string,
      responseId: string,
      hospitalId: string,
    ) {
      // Verify alert belongs to this hospital
      const { data: alert } = await this.supabase
        .from('alerts')
        .select('alert_id, hospital_id, units_needed, units_fulfilled')
        .eq('alert_id', alertId)
        .eq('hospital_id', hospitalId)
        .single();
  
      if (!alert) {
        throw new ForbiddenException('You do not have access to this alert.');
      }
  
      // Get the response
      const { data: response } = await this.supabase
        .from('donation_responses')
        .select('response_id, user_id, status')
        .eq('response_id', responseId)
        .eq('alert_id', alertId)
        .single();
  
      if (!response) {
        throw new NotFoundException('Donation response not found.');
      }
  
      if (response.status === 'Donated') {
        throw new BadRequestException('This donation has already been confirmed.');
      }
  
      const { data: confirmation, error: confirmationError } =
        await this.supabase.rpc('confirm_donation', {
          p_alert_id: alertId,
          p_response_id: responseId,
          p_user_id: response.user_id,
        });

      if (confirmationError || !confirmation?.[0]) {
        console.error('Donation confirmation RPC failed:', {
          code: confirmationError?.code,
          message: confirmationError?.message,
          details: confirmationError?.details,
          hint: confirmationError?.hint,
        });
        throw new BadRequestException('Failed to confirm donation.');
      }

      const { donor_locked_until: eligibleFrom, alert_status: alertStatus } =
        confirmation[0];
  
      return {
        message: 'Donation confirmed successfully.',
        donor_locked_until: eligibleFrom,
        alert_status: alertStatus,
      };
    }
  
    // ─── Cancel Alert ───────────────────────────────────────────────
    async cancelAlert(
      alertId: string,
      hospitalId: string,
      dto: CancelAlertDto,
    ) {
      const { data: alert } = await this.supabase
        .from('alerts')
        .select('alert_id, status')
        .eq('alert_id', alertId)
        .eq('hospital_id', hospitalId)
        .single();
  
      if (!alert) {
        throw new ForbiddenException('You do not have access to this alert.');
      }
  
      if (alert.status !== 'Active') {
        throw new BadRequestException(
          `Alert cannot be cancelled. Current status: ${alert.status}`,
        );
      }
  
      await this.supabase
        .from('alerts')
        .update({
          status: 'Cancelled',
          cancelled_at: new Date(),
          cancellation_reason: dto.cancellation_reason,
        })
        .eq('alert_id', alertId);
  
      return { message: 'Alert cancelled successfully.' };
    }
  }
import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
  } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import { createClient, SupabaseClient } from '@supabase/supabase-js';
  import { AcceptAlertDto } from './donations.dto';
  
  @Injectable()
  export class DonationsService {
    private supabase: SupabaseClient;
  
    constructor(private configService: ConfigService) {
      const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
      const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
  
      if (!supabaseUrl) throw new Error('SUPABASE_URL is not defined.');
      if (!supabaseKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined.');
  
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  
    // ─── Get Active Alerts Near Donor ───────────────────────────────
    async getActiveAlertsForDonor(userId: string) {
      // Get donor details
      const { data: donor } = await this.supabase
        .from('users')
        .select('blood_group, is_eligible, aadhaar_verified, max_alert_radius_km')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();
  
      if (!donor) throw new NotFoundException('Donor not found.');
  
      if (!donor.aadhaar_verified) {
        throw new ForbiddenException(
          'Please complete Aadhaar verification to view alerts.',
        );
      }
  
      // Get donor's primary location
      const { data: location } = await this.supabase
        .from('user_locations')
        .select('location_id')
        .eq('user_id', userId)
        .eq('is_primary', true)
        .single();
  
      if (!location) {
        throw new ForbiddenException(
          'Please update your location to view nearby alerts.',
        );
      }
  
      // Fetch active alerts matching donor blood group
      const { data, error } = await this.supabase
        .from('alerts')
        .select(`
          alert_id,
          blood_group,
          units_needed,
          units_fulfilled,
          urgency,
          department,
          patient_condition,
          status,
          expires_at,
          created_at,
          hospitals (
            name,
            address,
            city,
            pincode
          )
        `)
        .eq('status', 'Active')
        .eq('blood_group', donor.blood_group)
        .order('urgency', { ascending: true })
        .order('created_at', { ascending: true });
  
      if (error) throw new BadRequestException('Failed to fetch alerts.');
  
      return {
        is_eligible: donor.is_eligible,
        alerts: data,
      };
    }
  
    // ─── Accept Alert ────────────────────────────────────────────────
    async acceptAlert(
      userId: string,
      alertId: string,
      dto: AcceptAlertDto,
    ) {
      // Verify donor eligibility
      const { data: donor } = await this.supabase
        .from('users')
        .select('user_id, blood_group, is_eligible, aadhaar_verified')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .single();
  
      if (!donor) throw new NotFoundException('Donor not found.');
  
      if (!donor.aadhaar_verified) {
        throw new ForbiddenException(
          'Please complete Aadhaar verification before accepting alerts.',
        );
      }
  
      if (!donor.is_eligible) {
        throw new ForbiddenException(
          'You are not eligible to donate at this time.',
        );
      }
  
      // Verify alert is still active
      const { data: alert } = await this.supabase
        .from('alerts')
        .select('alert_id, blood_group, status, units_needed, units_fulfilled, hospital_id, expires_at')
        .eq('alert_id', alertId)
        .single();
  
      if (!alert) throw new NotFoundException('Alert not found.');
  
      if (alert.status !== 'Active') {
        throw new BadRequestException(
          `This alert is no longer active. Current status: ${alert.status}`,
        );
      }
  
      if (new Date() > new Date(alert.expires_at)) {
        throw new BadRequestException('This alert has expired.');
      }
  
      if (alert.blood_group !== donor.blood_group) {
        throw new ForbiddenException(
          'Your blood group does not match this alert.',
        );
      }
  
      // Check if donor already responded to this alert
      const { data: existingResponse } = await this.supabase
        .from('donation_responses')
        .select('response_id, status')
        .eq('alert_id', alertId)
        .eq('user_id', userId)
        .single();
  
      if (existingResponse) {
        throw new BadRequestException(
          'You have already responded to this alert.',
        );
      }
  
      // Create donation response
      const { data: response, error } = await this.supabase
        .from('donation_responses')
        .insert({
          alert_id: alertId,
          user_id: userId,
          hospital_id: alert.hospital_id,
          status: 'Accepted',
          eta_minutes: dto.eta_minutes ?? null,
          accepted_at: new Date(),
        })
        .select()
        .single();
  
      if (error || !response) {
        throw new BadRequestException('Failed to accept alert.');
      }
  
      // Update alert accepted count via RPC.
      const { error: incrementAcceptedCountError } = await this.supabase.rpc(
        'increment_accepted_count',
        {
          p_alert_id: alertId,
        },
      );

      if (incrementAcceptedCountError) {
        console.error('Increment accepted count RPC failed:', {
          code: incrementAcceptedCountError.code,
          message: incrementAcceptedCountError.message,
          details: incrementAcceptedCountError.details,
          hint: incrementAcceptedCountError.hint,
        });
        throw new BadRequestException('Failed to update alert accepted count.');
      }
  
      // Update notification record
      await this.supabase
        .from('alert_notifications')
        .update({
          delivery_status: 'Accepted',
          response: 'Accepted',
          responded_at: new Date(),
        })
        .eq('alert_id', alertId)
        .eq('user_id', userId);
  
      return {
        message: 'Alert accepted successfully. Please proceed to the hospital.',
        response_id: response.response_id,
        hospital: {
          name: null,   // fetched separately below
        },
        eta_minutes: dto.eta_minutes,
      };
    }
  
    // ─── Decline Alert ───────────────────────────────────────────────
    async declineAlert(userId: string, alertId: string) {
      // Update notification record
      const { error } = await this.supabase
        .from('alert_notifications')
        .update({
          delivery_status: 'Declined',
          response: 'Declined',
          responded_at: new Date(),
        })
        .eq('alert_id', alertId)
        .eq('user_id', userId);
  
      if (error) throw new BadRequestException('Failed to decline alert.');
  
      return { message: 'Alert declined.' };
    }
  
    // ─── Mark Arrived ────────────────────────────────────────────────
    async markArrived(userId: string, alertId: string) {
      const { data: response } = await this.supabase
        .from('donation_responses')
        .select('response_id, status')
        .eq('alert_id', alertId)
        .eq('user_id', userId)
        .single();
  
      if (!response) {
        throw new NotFoundException(
          'No accepted response found for this alert.',
        );
      }
  
      if (response.status !== 'Accepted') {
        throw new BadRequestException(
          `Cannot mark arrived. Current status: ${response.status}`,
        );
      }
  
      await this.supabase
        .from('donation_responses')
        .update({
          status: 'Arrived',
          arrived_at: new Date(),
        })
        .eq('response_id', response.response_id);
  
      return {
        message: 'Arrival confirmed. Please check in with hospital staff.',
      };
    }
  
    // ─── Get Donation History ────────────────────────────────────────
    async getDonationHistory(userId: string) {
      const { data, error } = await this.supabase
        .from('donation_responses')
        .select(`
          response_id,
          status,
          accepted_at,
          arrived_at,
          confirmed_at,
          points_awarded,
          alerts (
            blood_group,
            urgency,
            department,
            hospitals (
              name,
              city
            )
          )
        `)
        .eq('user_id', userId)
        .order('accepted_at', { ascending: false });
  
      if (error) throw new BadRequestException('Failed to fetch donation history.');
  
      return data;
    }
  
    // ─── Get Donor Stats ─────────────────────────────────────────────
    async getDonorStats(userId: string) {
      const { data: donor } = await this.supabase
        .from('users')
        .select('donor_score, tier, reward_points, last_donated_at, eligible_from, is_eligible')
        .eq('user_id', userId)
        .single();
  
      if (!donor) throw new NotFoundException('Donor not found.');
  
      const { count: totalDonations } = await this.supabase
        .from('donation_responses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'Donated');
  
      const { count: noShows } = await this.supabase
        .from('donation_responses')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'NoShow');
  
      return {
        donor_score: donor.donor_score,
        tier: donor.tier,
        reward_points: donor.reward_points,
        total_donations: totalDonations,
        no_shows: noShows,
        last_donated_at: donor.last_donated_at,
        eligible_from: donor.eligible_from,
        is_eligible: donor.is_eligible,
        days_until_eligible: donor.eligible_from
          ? Math.max(
              0,
              Math.ceil(
                (new Date(donor.eligible_from).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24),
              ),
            )
          : null,
      };
    }
  }
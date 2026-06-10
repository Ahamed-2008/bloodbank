import {
    Injectable,
    BadRequestException,
    NotFoundException,
  } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import { createClient, SupabaseClient } from '@supabase/supabase-js';
  import { RejectHospitalDto } from './admin.dto';
  
  @Injectable()
  export class AdminService {
    private supabase: SupabaseClient;
  
    constructor(private configService: ConfigService) {
      const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
      const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
  
      if (!supabaseUrl) throw new Error('SUPABASE_URL is not defined.');
      if (!supabaseKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined.');
  
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  
    // ─── Dashboard Stats ────────────────────────────────────────────
    async getDashboardStats() {
      const [
        { count: totalDonors },
        { count: totalHospitals },
        { count: pendingHospitals },
        { count: activeAlerts },
        { count: totalDonations },
      ] = await Promise.all([
        this.supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null),
        this.supabase
          .from('hospitals')
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null),
        this.supabase
          .from('hospital_verifications')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Pending'),
        this.supabase
          .from('alerts')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Active'),
        this.supabase
          .from('donation_responses')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Donated'),
      ]);
  
      return {
        total_donors: totalDonors,
        total_hospitals: totalHospitals,
        pending_hospitals: pendingHospitals,
        active_alerts: activeAlerts,
        total_donations: totalDonations,
      };
    }
  
    // ─── List Hospitals by Status ───────────────────────────────────
    async getHospitals(status: 'Pending' | 'Approved' | 'Rejected' | 'all') {
      let query = this.supabase
        .from('hospitals')
        .select(`
          hospital_id,
          name,
          registration_number,
          hospital_type,
          contact_name,
          contact_phone,
          contact_email,
          city,
          state,
          is_verified,
          is_active,
          created_at,
          hospital_verifications (
            verification_id,
            license_number,
            license_doc_url,
            license_issued_at,
            license_expires_at,
            status,
            rejection_reason,
            verified_at
          )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
  
      if (status !== 'all') {
        query = query.eq('hospital_verifications.status', status);
      }
  
      const { data, error } = await query;
  
      if (error) throw new BadRequestException('Failed to fetch hospitals.');
  
      return data;
    }
  
    // ─── Get Single Hospital ────────────────────────────────────────
    async getHospitalById(hospitalId: string) {
      const { data, error } = await this.supabase
        .from('hospitals')
        .select(`
          hospital_id,
          name,
          registration_number,
          hospital_type,
          contact_name,
          contact_phone,
          contact_email,
          address,
          pincode,
          city,
          state,
          is_verified,
          is_active,
          created_at,
          hospital_verifications (
            verification_id,
            license_number,
            license_doc_url,
            license_issued_at,
            license_expires_at,
            status,
            rejection_reason,
            verified_at
          ),
          hospital_staff (
            staff_id,
            name,
            phone,
            role,
            is_active
          )
        `)
        .eq('hospital_id', hospitalId)
        .is('deleted_at', null)
        .single();
  
      if (error || !data) {
        throw new NotFoundException('Hospital not found.');
      }
  
      return data;
    }
  
    // ─── Approve Hospital ───────────────────────────────────────────
    async approveHospital(hospitalId: string, adminId: string) {
      // Verify hospital exists and is pending
      const { data: hospital } = await this.supabase
        .from('hospitals')
        .select('hospital_id, is_verified')
        .eq('hospital_id', hospitalId)
        .single();
  
      if (!hospital) {
        throw new NotFoundException('Hospital not found.');
      }
  
      if (hospital.is_verified) {
        throw new BadRequestException('Hospital is already verified.');
      }
  
      const now = new Date();
  
      // Approve hospital
      await this.supabase
        .from('hospitals')
        .update({
          is_verified: true,
          is_active: true,
          updated_at: now,
        })
        .eq('hospital_id', hospitalId);
  
      // Update verification record
      await this.supabase
        .from('hospital_verifications')
        .update({
          status: 'Approved',
          verified_by: adminId,
          verified_at: now,
        })
        .eq('hospital_id', hospitalId);
  
      // Activate the hospital's Admin staff account
      await this.supabase
        .from('hospital_staff')
        .update({
          is_active: true,
          updated_at: now,
        })
        .eq('hospital_id', hospitalId)
        .eq('role', 'Admin');
  
      // TODO: Send approval notification to hospital contact
      console.log(`Hospital ${hospitalId} approved by admin ${adminId}`);
  
      return {
        message: 'Hospital approved successfully. Staff account activated.',
      };
    }
  
    // ─── Reject Hospital ────────────────────────────────────────────
    async rejectHospital(
      hospitalId: string,
      adminId: string,
      dto: RejectHospitalDto,
    ) {
      const { data: hospital } = await this.supabase
        .from('hospitals')
        .select('hospital_id, is_verified')
        .eq('hospital_id', hospitalId)
        .single();
  
      if (!hospital) {
        throw new NotFoundException('Hospital not found.');
      }
  
      if (hospital.is_verified) {
        throw new BadRequestException('Cannot reject an already verified hospital.');
      }
  
      const now = new Date();
  
      // Update verification record
      await this.supabase
        .from('hospital_verifications')
        .update({
          status: 'Rejected',
          verified_by: adminId,
          verified_at: now,
          rejection_reason: dto.reason,
        })
        .eq('hospital_id', hospitalId);
  
      // TODO: Send rejection notification to hospital contact
      console.log(`Hospital ${hospitalId} rejected by admin ${adminId}`);
  
      return {
        message: 'Hospital rejected successfully.',
      };
    }
  
    // ─── List All Donors ────────────────────────────────────────────
    async getDonors() {
      const { data, error } = await this.supabase
        .from('users')
        .select(`
          user_id,
          name,
          phone,
          blood_group,
          is_eligible,
          aadhaar_verified,
          health_verified,
          donor_score,
          tier,
          reward_points,
          last_donated_at,
          created_at
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
  
      if (error) throw new BadRequestException('Failed to fetch donors.');
  
      return data;
    }
  
    // ─── List All Active Alerts ─────────────────────────────────────
    async getActiveAlerts() {
      const { data, error } = await this.supabase
        .from('alerts')
        .select(`
          alert_id,
          blood_group,
          units_needed,
          units_fulfilled,
          urgency,
          department,
          status,
          notified_count,
          accepted_count,
          expires_at,
          created_at,
          hospitals (
            name,
            city
          )
        `)
        .eq('status', 'Active')
        .order('created_at', { ascending: false });
  
      if (error) throw new BadRequestException('Failed to fetch alerts.');
  
      return data;
    }
  }
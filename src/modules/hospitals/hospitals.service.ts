import {
    Injectable,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
  } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import { createClient, SupabaseClient } from '@supabase/supabase-js';
  import { RegisterHospitalDto, AddStaffDto } from './hospitals.dto';
  
  @Injectable()
  export class HospitalsService {
    private supabase: SupabaseClient;
  
    constructor(private configService: ConfigService) {
      const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
      const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
  
      if (!supabaseUrl) throw new Error('SUPABASE_URL is not defined.');
      if (!supabaseKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined.');
  
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  
    // ─── Register Hospital ──────────────────────────────────────────
    async registerHospital(dto: RegisterHospitalDto) {
      // Check for duplicate registration number
      const { data: existing } = await this.supabase
        .from('hospitals')
        .select('hospital_id')
        .eq('registration_number', dto.registration_number)
        .single();
  
      if (existing) {
        throw new BadRequestException(
          'A hospital with this registration number already exists.',
        );
      }
  
const { data: hospital, error: hospitalError } = await this.supabase.rpc(
        'create_hospital_record',
        {
          p_name: dto.name,
          p_registration_number: dto.registration_number,
          p_hospital_type: dto.hospital_type,
          p_contact_name: dto.contact_name,
          p_contact_phone: dto.contact_phone,
          p_contact_email: dto.contact_email,
          p_latitude: dto.latitude,
          p_longitude: dto.longitude,
          p_address: dto.address,
          p_pincode: dto.pincode,
          p_city: dto.city,
          p_state: dto.state,
        },
      );

      if (hospitalError || !hospital || hospital.length === 0) {
        console.error('Hospital RPC failed:', {
          code: hospitalError?.code,
          message: hospitalError?.message,
          details: hospitalError?.details,
          hint: hospitalError?.hint,
        });
        throw new BadRequestException('Failed to register hospital.');
      }

      const hospitalId = hospital[0]?.hospital_id;

      if (!hospitalId) {
        throw new BadRequestException('Failed to register hospital.');
      }
  
      // Automatically create first staff account from contact details
      const { error: staffError } = await this.supabase
        .from('hospital_staff')
        .insert({
          hospital_id: hospitalId,
          name: dto.contact_name,
          phone: dto.contact_phone,
          email: dto.contact_email,
          role: 'Admin',
          is_active: false,  // activated only after hospital is approved
        });
  
      if (staffError) {
          console.error('Hospital staff insert failed:', {
            code: staffError.code,
            message: staffError.message,
            details: staffError.details,
            hint: staffError.hint,
          });
        throw new BadRequestException('Failed to create staff account.');
      }
  
      // Create verification record
      const { error: verificationError } = await this.supabase
        .from('hospital_verifications')
        .insert({
          hospital_id: hospitalId,
          license_number: dto.license_number,
          license_doc_url: 'pending_upload',
          license_issued_at: dto.license_issued_at,
          license_expires_at: dto.license_expires_at,
          status: 'Pending',
        });
  
      if (verificationError) {
          console.error('Hospital verification insert failed:', {
            code: verificationError.code,
            message: verificationError.message,
            details: verificationError.details,
            hint: verificationError.hint,
          });
        throw new BadRequestException('Failed to save license details.');
      }
  
      return {
        message: 'Hospital registered successfully. Awaiting admin verification.',
        hospital_id: hospitalId,
      };
    }
  
    // ─── Get Hospital Profile ───────────────────────────────────────
    async getHospitalProfile(hospitalId: string) {
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
            license_number,
            license_expires_at,
            status
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
  
    // ─── Add Staff Member ───────────────────────────────────────────
    async addStaff(
      hospitalId: string,
      requestingStaffRole: string,
      dto: AddStaffDto,
    ) {
      if (requestingStaffRole !== 'Admin') {
        throw new ForbiddenException(
          'Only hospital admins can add staff members.',
        );
      }
  
      const { data: existing } = await this.supabase
        .from('hospital_staff')
        .select('staff_id')
        .eq('phone', dto.phone)
        .single();
  
      if (existing) {
        throw new BadRequestException(
          'This phone number is already registered as staff.',
        );
      }
  
      const { data, error } = await this.supabase
        .from('hospital_staff')
        .insert({
          hospital_id: hospitalId,
          name: dto.name,
          phone: dto.phone,
          email: dto.email ?? null,
          role: dto.role,
          is_active: true,
        })
        .select('staff_id, name, phone, role')
        .single();
  
      if (error || !data) {
        throw new BadRequestException('Failed to add staff member.');
      }
  
      return {
        message: 'Staff member added successfully.',
        staff: data,
      };
    }
  
    // ─── Get All Staff ──────────────────────────────────────────────
    async getStaff(hospitalId: string) {
      const { data, error } = await this.supabase
        .from('hospital_staff')
        .select('staff_id, name, phone, email, role, is_active, created_at')
        .eq('hospital_id', hospitalId)
        .order('created_at', { ascending: true });
  
      if (error) throw new BadRequestException('Failed to fetch staff.');
  
      return data;
    }
  }
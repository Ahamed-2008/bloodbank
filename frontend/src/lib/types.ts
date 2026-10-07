export type Role = "donor" | "hospital_staff" | "admin";

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export const GENDERS = ["Male", "Female", "Other"] as const;
export type Gender = (typeof GENDERS)[number];

export const URGENCY_LEVELS = ["Critical", "High", "Normal"] as const;
export type Urgency = (typeof URGENCY_LEVELS)[number] | "critical" | "urgent" | "routine";

export const DEPARTMENTS = [
  "Emergency",
  "ICU",
  "OT",
  "GeneralWard",
  "LabourRoom",
  "BloodBank",
  "Other",
] as const;
export type Department = (typeof DEPARTMENTS)[number];

export const HOSPITAL_TYPES = ["Government", "Private", "Trust", "Clinic"] as const;
export type HospitalType = (typeof HOSPITAL_TYPES)[number] | "government" | "private" | "trust" | "clinic";

export const STAFF_ROLES = ["Admin", "Operator"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number] | "admin" | "operator";

export type VerificationStatus = "Pending" | "Approved" | "Rejected" | "pending" | "verified" | "rejected";
export type AlertStatus = "Active" | "Fulfilled" | "Cancelled" | "Expired" | "open" | "fulfilled" | "cancelled" | "expired";
export type ResponseStatus =
  | "Accepted"
  | "Arrived"
  | "Donated"
  | "NoShow"
  | "Cancelled"
  | "pending"
  | "accepted"
  | "declined"
  | "confirmed"
  | "completed";

// ── Auth Types ──
export interface AuthResponse {
  token: string;
  isNewUser: boolean;
  role: Role;
}

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  role: Role;
  hospitalName?: string;
  isNewUser?: boolean;
}

// ── Donor / User Types ──
export interface DonorProfile {
  user_id: string;
  phone: string;
  name: string;
  blood_group: BloodGroup;
  date_of_birth: string;
  gender: Gender;
  is_eligible: boolean;
  last_donated_at: string | null;
  eligible_from: string | null;
  donor_score: number;
  tier: string;
  reward_points: number;
  aadhaar_verified: boolean;
  health_verified: boolean;
  notifications_enabled: boolean;
  max_alert_radius_km: number;
  created_at: string;
}

export interface CompleteProfileInput {
  name: string;
  blood_group: BloodGroup;
  date_of_birth: string;
  gender: Gender;
}

export interface UpdateLocationInput {
  latitude: number;
  longitude: number;
  pincode: string;
  city?: string;
  state?: string;
}

export interface DonorLocation {
  latitude: number;
  longitude: number;
  pincode: string;
  city: string;
  state: string;
}

export interface NotificationSettings {
  notifications_enabled: boolean;
  max_alert_radius_km: number;
}

export interface Eligibility {
  is_eligible: boolean;
  last_donated_at: string | null;
  eligible_from: string | null;
  donor_score: number;
  tier: string;
  days_until_eligible: number | null;
}

export interface DonorStats {
  donor_score: number;
  tier: string;
  reward_points: number;
  total_donations: number;
  no_shows: number;
  last_donated_at: string | null;
  eligible_from: string | null;
  is_eligible: boolean;
  days_until_eligible: number | null;
}

export interface ActiveAlertHospital {
  name: string;
  address: string;
  city: string;
  pincode?: string;
}

export interface ActiveAlertItem {
  alert_id: string;
  blood_group: BloodGroup;
  units_needed: number;
  units_fulfilled: number;
  urgency: Urgency;
  department: Department;
  patient_condition?: string | null;
  status: string;
  expires_at: string;
  created_at?: string;
  hospitals: ActiveAlertHospital;
}

export interface ActiveDonationAlertsResponse {
  is_eligible: boolean;
  alerts: ActiveAlertItem[];
}

export interface DonationHistoryRecord {
  response_id: string;
  status: ResponseStatus;
  accepted_at: string;
  arrived_at: string | null;
  confirmed_at: string | null;
  points_awarded?: number;
  alerts: {
    blood_group: BloodGroup;
    urgency: Urgency;
    department: Department;
    hospitals: {
      name: string;
      city: string;
    };
  };
}

// ── Hospital Types ──
export interface RegisterHospitalInput {
  name: string;
  registration_number: string;
  hospital_type: "Government" | "Private" | "Trust" | "Clinic";
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  latitude: number;
  longitude: number;
  address: string;
  pincode: string;
  city: string;
  state: string;
  license_number: string;
  license_issued_at: string;
  license_expires_at: string;
}

export interface HospitalVerification {
  verification_id?: string;
  license_number: string;
  license_doc_url?: string;
  license_issued_at?: string;
  license_expires_at?: string;
  status: VerificationStatus;
  rejection_reason?: string | null;
  verified_at?: string | null;
}

export interface HospitalProfile {
  hospital_id: string;
  name: string;
  registration_number: string;
  hospital_type: "Government" | "Private" | "Trust" | "Clinic";
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  address: string;
  pincode: string;
  city: string;
  state: string;
  is_verified: boolean;
  is_active: boolean;
  created_at?: string;
  hospital_verifications: HospitalVerification[];
}

export interface StaffMember {
  staff_id: string;
  name: string;
  phone: string;
  email: string | null;
  role: "Admin" | "Operator";
  is_active: boolean;
  created_at: string;
}

export interface AddStaffInput {
  name: string;
  phone: string;
  email?: string;
  role: "Admin" | "Operator";
}

export interface CreateAlertInput {
  blood_group: BloodGroup;
  units_needed: number;
  urgency: "Critical" | "High" | "Normal";
  department: Department;
  patient_ref?: string;
  patient_condition?: string;
  auto_expand_radius?: boolean;
  radius_km?: number;
}

export interface HospitalAlert {
  alert_id: string;
  blood_group: BloodGroup;
  units_needed: number;
  units_fulfilled: number;
  urgency: Urgency;
  department: Department;
  patient_ref?: string | null;
  patient_condition?: string | null;
  status: string;
  notified_count: number;
  accepted_count: number;
  expires_at: string;
  created_at: string;
}

export interface AlertDetail {
  alert_id: string;
  blood_group: BloodGroup;
  units_needed: number;
  units_fulfilled: number;
  urgency: Urgency;
  department: Department;
  patient_ref?: string | null;
  patient_condition?: string | null;
  status: string;
  radius_km?: number;
  notified_count: number;
  accepted_count: number;
  expires_at: string;
  created_at: string;
  hospitals: {
    name: string;
    city: string;
    address: string;
  };
}

export interface AlertDonorResponse {
  response_id: string;
  status: ResponseStatus;
  accepted_at: string;
  eta_minutes: number | null;
  arrived_at: string | null;
  confirmed_at: string | null;
  users: {
    name: string;
    blood_group: BloodGroup;
    donor_score: number;
    tier: string;
  };
}

// ── Admin Types ──
export interface AdminDashboardStats {
  total_donors: number;
  total_hospitals: number;
  pending_hospitals: number;
  active_alerts: number;
  total_donations: number;
}

export interface AdminHospital {
  hospital_id: string;
  name: string;
  registration_number: string;
  hospital_type: "Government" | "Private" | "Trust" | "Clinic";
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  city: string;
  state: string;
  is_verified: boolean;
  is_active: boolean;
  created_at?: string;
  hospital_verifications: HospitalVerification[];
}

export interface AdminHospitalDetail extends AdminHospital {
  address?: string;
  pincode?: string;
  hospital_staff?: Array<{
    staff_id: string;
    name: string;
    phone: string;
    role: "Admin" | "Operator";
    is_active: boolean;
  }>;
}

export interface AdminDonor {
  user_id: string;
  name: string;
  phone: string;
  blood_group: BloodGroup;
  is_eligible: boolean;
  aadhaar_verified: boolean;
  health_verified: boolean;
  donor_score: number;
  tier: string;
  reward_points: number;
  last_donated_at: string | null;
  created_at: string;
}

export interface AdminAlert {
  alert_id: string;
  blood_group: BloodGroup;
  units_needed: number;
  units_fulfilled: number;
  urgency: Urgency;
  department: Department;
  status: string;
  notified_count: number;
  accepted_count: number;
  expires_at: string;
  created_at: string;
  hospitals: {
    name: string;
    city: string;
  };
}

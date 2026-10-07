export type Role = "donor" | "hospital_staff" | "admin";

export const BLOOD_GROUPS = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export const URGENCY_LEVELS = ["critical", "urgent", "routine"] as const;
export type Urgency = (typeof URGENCY_LEVELS)[number];

export type AlertStatus = "open" | "fulfilled" | "cancelled" | "expired";
export type ResponseStatus = "pending" | "accepted" | "declined" | "confirmed" | "completed";
export type DonationStatus = "completed" | "deferred" | "cancelled";
export type VerificationStatus = "pending" | "verified" | "rejected";
export type HospitalType = "government" | "private" | "trust" | "clinic";
export type StaffRole = "admin" | "operator";

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  role: Role;
  hospitalName?: string;
}

export interface DonorProfile {
  id: string;
  name: string;
  phone: string;
  bloodGroup: BloodGroup;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
}

export interface DonorLocation {
  latitude: number;
  longitude: number;
  pincode: string;
  city: string;
  state: string;
}

export interface NotificationSettings {
  notificationsEnabled: boolean;
  maxAlertRadiusKm: number;
}

export interface Eligibility {
  eligible: boolean;
  reason: string;
  lastDonationDate: string | null;
  nextEligibleDate: string | null;
  daysUntilEligible: number;
}

export interface DonorStats {
  totalDonations: number;
  successfulDonations: number;
  livesImpacted: number;
  alertsAccepted: number;
  lastDonationDate: string | null;
  nextEligibleDate: string | null;
  monthly: { month: string; donations: number }[];
}

export interface BloodAlert {
  id: string;
  bloodGroup: BloodGroup;
  unitsRequired: number;
  unitsFulfilled: number;
  urgency: Urgency;
  status: AlertStatus;
  hospitalId: string;
  hospitalName: string;
  city: string;
  state: string;
  address: string;
  distanceKm: number;
  patientCondition: string;
  neededBy: string;
  createdAt: string;
  contactPhone: string;
  responseCount: number;
  cancellationReason?: string;
  myResponse?: ResponseStatus;
}

export interface DonationRecord {
  id: string;
  hospitalName: string;
  city: string;
  date: string;
  bloodGroup: BloodGroup;
  units: number;
  status: DonationStatus;
}

export interface DonorResponse {
  id: string;
  alertId: string;
  donorName: string;
  bloodGroup: BloodGroup;
  phone: string;
  distanceKm: number;
  respondedAt: string;
  status: ResponseStatus;
}

export interface Hospital {
  id: string;
  name: string;
  registrationNumber: string;
  type: HospitalType;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  latitude: number;
  longitude: number;
  address: string;
  pincode: string;
  city: string;
  state: string;
  licenseNumber: string;
  licenseIssuedDate: string;
  licenseExpiryDate: string;
  verificationStatus: VerificationStatus;
  rejectionReason?: string;
  createdAt: string;
  alertsCreated: number;
}

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: StaffRole;
  addedAt: string;
}

export interface AdminDonor {
  id: string;
  name: string;
  phone: string;
  bloodGroup: BloodGroup;
  city: string;
  state: string;
  totalDonations: number;
  eligible: boolean;
  lastDonationDate: string | null;
  joinedAt: string;
}

export interface AdminStats {
  hospitals: number;
  pendingVerifications: number;
  donors: number;
  activeAlerts: number;
  unitsFulfilledThisMonth: number;
  responseRate: number;
  alertsByGroup: { bloodGroup: BloodGroup; alerts: number }[];
}

export interface HospitalStats {
  activeAlerts: number;
  totalAlerts: number;
  donorResponses: number;
  unitsFulfilled: number;
  averageResponseMinutes: number;
  weekly: { day: string; responses: number }[];
}

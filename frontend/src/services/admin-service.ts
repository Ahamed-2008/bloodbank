import type {
  AdminAlert,
  AdminDashboardStats,
  AdminDonor,
  AdminHospital,
  AdminHospitalDetail,
  VerificationStatus,
} from "@/lib/types";
import { apiRequest } from "./api-client";

export const adminService = {
  /**
   * GET /api/v1/admin/dashboard
   * Returns network-wide counts: donors, hospitals, pending verifications, alerts, donations.
   */
  getDashboard: (): Promise<AdminDashboardStats> => {
    return apiRequest<AdminDashboardStats>("/admin/dashboard");
  },

  /**
   * GET /api/v1/admin/hospitals
   * Lists hospitals with optional status filter ('Pending' | 'Approved' | 'Rejected').
   */
  getHospitals: (status?: VerificationStatus): Promise<AdminHospital[]> => {
    // Backend expects 'Pending', 'Approved', 'Rejected'
    let queryStatus: string | undefined = undefined;
    if (typeof status === "string" && status.trim()) {
      const s = status.toLowerCase();
      if (s === "pending") queryStatus = "Pending";
      else if (s === "approved" || s === "verified") queryStatus = "Approved";
      else if (s === "rejected") queryStatus = "Rejected";
      else queryStatus = status;
    }
    return apiRequest<AdminHospital[]>("/admin/hospitals", {
      query: queryStatus ? { status: queryStatus } : undefined,
    });
  },

  /**
   * GET /api/v1/admin/hospitals/:id
   * Returns full hospital profile, license verifications, and staff list.
   */
  getHospital: (id: string): Promise<AdminHospitalDetail> => {
    return apiRequest<AdminHospitalDetail>(`/admin/hospitals/${encodeURIComponent(id)}`);
  },

  /**
   * PUT /api/v1/admin/hospitals/:id/approve
   * Approves hospital and activates the primary admin staff account.
   */
  approveHospital: (id: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/admin/hospitals/${encodeURIComponent(id)}/approve`, {
      method: "PUT",
    });
  },

  /**
   * PUT /api/v1/admin/hospitals/:id/reject
   * Rejects hospital verification with a required reason (10-500 characters).
   */
  rejectHospital: (id: string, reason: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/admin/hospitals/${encodeURIComponent(id)}/reject`, {
      method: "PUT",
      body: { reason },
    });
  },

  /**
   * GET /api/v1/admin/donors
   * Lists donors with optional verified filter ('true' | 'false').
   */
  getDonors: (verified?: boolean): Promise<AdminDonor[]> => {
    return apiRequest<AdminDonor[]>("/admin/donors", {
      query: typeof verified === "boolean" ? { verified: String(verified) } : undefined,
    });
  },

  /**
   * PUT /api/v1/admin/donors/:id/approve
   * Approves donor verification (sets aadhaar_verified = true).
   */
  approveDonor: (id: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/admin/donors/${encodeURIComponent(id)}/approve`, {
      method: "PUT",
    });
  },

  /**
   * PUT /api/v1/admin/donors/:id/reject
   * Rejects donor verification with a required reason (10-500 characters).
   */
  rejectDonor: (id: string, reason: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/admin/donors/${encodeURIComponent(id)}/reject`, {
      method: "PUT",
      body: { reason },
    });
  },

  /**
   * GET /api/v1/admin/alerts
   * Lists all active blood alerts across all hospitals.
   */
  getActiveAlerts: (): Promise<AdminAlert[]> => {
    return apiRequest<AdminAlert[]>("/admin/alerts");
  },
};

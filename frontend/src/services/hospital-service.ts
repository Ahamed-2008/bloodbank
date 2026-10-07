import type {
  AddStaffInput,
  AlertDetail,
  AlertDonorResponse,
  CreateAlertInput,
  HospitalAlert,
  HospitalProfile,
  RegisterHospitalInput,
  StaffMember,
} from "@/lib/types";
import { apiRequest } from "./api-client";

export const hospitalService = {
  /**
   * POST /api/v1/hospitals/register
   * Registers a new hospital and initial admin staff account.
   */
  registerHospital: (
    input: RegisterHospitalInput,
  ): Promise<{ message: string; hospital_id: string }> => {
    return apiRequest<{ message: string; hospital_id: string }>("/hospitals/register", {
      method: "POST",
      body: input,
    });
  },

  /**
   * GET /api/v1/hospitals/profile
   * Returns current hospital profile and verification details.
   */
  getProfile: (): Promise<HospitalProfile> => {
    return apiRequest<HospitalProfile>("/hospitals/profile");
  },

  /**
   * GET /api/v1/hospitals/staff
   * Lists staff members for this hospital.
   */
  getStaff: (): Promise<StaffMember[]> => {
    return apiRequest<StaffMember[]>("/hospitals/staff");
  },

  /**
   * POST /api/v1/hospitals/staff
   * Adds a staff member (Admin or Operator). Caller must be Admin.
   */
  addStaff: (
    input: AddStaffInput,
  ): Promise<{ message: string; staff: StaffMember }> => {
    return apiRequest<{ message: string; staff: StaffMember }>("/hospitals/staff", {
      method: "POST",
      body: input,
    });
  },

  /**
   * POST /api/v1/alerts
   * Creates and broadcasts a new blood alert to nearby compatible donors.
   */
  createAlert: (
    input: CreateAlertInput,
  ): Promise<{ message: string; alert: HospitalAlert }> => {
    return apiRequest<{ message: string; alert: HospitalAlert }>("/alerts", {
      method: "POST",
      body: input,
    });
  },

  /**
   * GET /api/v1/alerts/hospital
   * Returns all alerts raised by the caller's hospital.
   */
  getHospitalAlerts: (): Promise<HospitalAlert[]> => {
    return apiRequest<HospitalAlert[]>("/alerts/hospital");
  },

  /**
   * GET /api/v1/alerts/:id
   * Returns details for a specific alert.
   */
  getAlert: (alertId: string): Promise<AlertDetail> => {
    return apiRequest<AlertDetail>(`/alerts/${encodeURIComponent(alertId)}`);
  },

  /**
   * GET /api/v1/alerts/:id/responses
   * Returns donor responses for an alert raised by the caller's hospital.
   */
  getAlertResponses: (alertId: string): Promise<AlertDonorResponse[]> => {
    return apiRequest<AlertDonorResponse[]>(`/alerts/${encodeURIComponent(alertId)}/responses`);
  },

  /**
   * PUT /api/v1/alerts/:id/confirm/:responseId
   * Confirms a donor donation, marks response as Donated, increments units_fulfilled.
   */
  confirmDonation: (
    alertId: string,
    responseId: string,
  ): Promise<{
    message: string;
    donor_locked_until: string;
    alert_status: string;
  }> => {
    return apiRequest(
      `/alerts/${encodeURIComponent(alertId)}/confirm/${encodeURIComponent(responseId)}`,
      {
        method: "PUT",
      },
    );
  },

  /**
   * PUT /api/v1/alerts/:id/cancel
   * Cancels an active blood alert with a required cancellation reason.
   */
  cancelAlert: (
    alertId: string,
    cancellation_reason: string,
  ): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/alerts/${encodeURIComponent(alertId)}/cancel`, {
      method: "PUT",
      body: { cancellation_reason },
    });
  },
};

import type {
  ActiveDonationAlertsResponse,
  AlertDetail,
  CompleteProfileInput,
  DonationHistoryRecord,
  DonorProfile,
  DonorStats,
  Eligibility,
  NotificationSettings,
  UpdateLocationInput,
} from "@/lib/types";
import { apiRequest } from "./api-client";

export const donorService = {
  /**
   * GET /api/v1/users/profile
   * Returns current donor's profile.
   */
  getProfile: (): Promise<DonorProfile> => {
    return apiRequest<DonorProfile>("/users/profile");
  },

  /**
   * PUT /api/v1/users/profile
   * Updates or completes donor onboarding profile.
   */
  updateProfile: (input: CompleteProfileInput): Promise<DonorProfile> => {
    return apiRequest<DonorProfile>("/users/profile", {
      method: "PUT",
      body: input,
    });
  },

  /**
   * PUT /api/v1/users/location
   * Saves or updates donor primary GPS coordinates and pincode.
   */
  updateLocation: (input: UpdateLocationInput): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>("/users/location", {
      method: "PUT",
      body: input,
    });
  },

  /**
   * GET /api/v1/users/eligibility
   * Returns current donation eligibility and remaining recovery days.
   */
  getEligibility: (): Promise<Eligibility> => {
    return apiRequest<Eligibility>("/users/eligibility");
  },

  /**
   * PUT /api/v1/users/notifications
   * Updates notification enabled status and alert radius (km).
   */
  updateNotificationSettings: (
    input: NotificationSettings,
  ): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>("/users/notifications", {
      method: "PUT",
      body: input,
    });
  },

  /**
   * PUT /api/v1/users/availability
   * Toggles donor availability (true to be matched, false to pause).
   */
  updateAvailability: (is_available: boolean): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>("/users/availability", {
      method: "PUT",
      body: { is_available },
    });
  },

  /**
   * GET /api/v1/donations/active
   * Returns active, unexpired alerts matching donor's blood group within radius.
   */
  getActiveAlerts: (): Promise<ActiveDonationAlertsResponse> => {
    return apiRequest<ActiveDonationAlertsResponse>("/donations/active");
  },

  /**
   * GET /api/v1/alerts/:id
   * Returns single blood alert detail with hospital information.
   */
  getAlert: (id: string): Promise<AlertDetail> => {
    return apiRequest<AlertDetail>(`/alerts/${encodeURIComponent(id)}`);
  },

  /**
   * POST /api/v1/donations/:alertId/accept
   * Accepts a blood alert, optionally providing estimated arrival time (minutes).
   */
  acceptAlert: (
    alertId: string,
    eta_minutes?: number,
  ): Promise<{
    message: string;
    response_id: string;
    hospital: { name: string | null; address: string | null };
    eta_minutes?: number;
  }> => {
    return apiRequest(`/donations/${encodeURIComponent(alertId)}/accept`, {
      method: "POST",
      body: eta_minutes ? { eta_minutes } : {},
    });
  },

  /**
   * POST /api/v1/donations/:alertId/decline
   * Declines a blood alert for this donor.
   */
  declineAlert: (alertId: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/donations/${encodeURIComponent(alertId)}/decline`, {
      method: "POST",
    });
  },

  /**
   * PUT /api/v1/donations/:alertId/arrived
   * Confirms donor arrival at the hospital for an accepted alert.
   */
  markArrived: (alertId: string): Promise<{ message: string }> => {
    return apiRequest<{ message: string }>(`/donations/${encodeURIComponent(alertId)}/arrived`, {
      method: "PUT",
    });
  },

  /**
   * GET /api/v1/donations/history
   * Lists past donation responses and statuses for this donor.
   */
  getDonations: (): Promise<DonationHistoryRecord[]> => {
    return apiRequest<DonationHistoryRecord[]>("/donations/history");
  },

  /**
   * GET /api/v1/donations/stats
   * Returns lifetime donor stats, score, tier, and reward points.
   */
  getStats: (): Promise<DonorStats> => {
    return apiRequest<DonorStats>("/donations/stats");
  },
};

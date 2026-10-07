import {
  mockAlerts,
  mockDonations,
  mockDonorLocation,
  mockDonorProfile,
  mockDonorStats,
  mockEligibility,
  mockNotificationSettings,
} from "@/lib/mock-data";
import type {
  BloodAlert,
  DonationRecord,
  DonorLocation,
  DonorProfile,
  DonorStats,
  Eligibility,
  NotificationSettings,
} from "@/lib/types";
import { mockDelay } from "./api-client";

/**
 * Donor endpoints on the existing NestJS API (to be wired later):
 *   GET   /donors/me                      -> profile
 *   PATCH /donors/me                      -> profile
 *   GET   /donors/me/location             -> location
 *   PATCH /donors/me/location             -> location
 *   GET   /donors/me/eligibility          -> eligibility
 *   GET   /donors/me/stats                -> stats
 *   GET   /donors/me/donations            -> donation history
 *   GET   /alerts/nearby                  -> active alerts
 *   POST  /alerts/:id/respond             -> accept / decline
 *   PATCH /donors/me/notification-settings
 */

let profile: DonorProfile = { ...mockDonorProfile };
let location: DonorLocation = { ...mockDonorLocation };
let settings: NotificationSettings = { ...mockNotificationSettings };
let alerts: BloodAlert[] = mockAlerts.map((alert) => ({ ...alert }));

export const donorService = {
  getProfile: (): Promise<DonorProfile> => mockDelay({ ...profile }),

  updateProfile: async (input: Partial<DonorProfile>): Promise<DonorProfile> => {
    profile = { ...profile, ...input };
    return mockDelay({ ...profile }, 600);
  },

  getLocation: (): Promise<DonorLocation> => mockDelay({ ...location }),

  updateLocation: async (input: DonorLocation): Promise<DonorLocation> => {
    location = { ...input };
    return mockDelay({ ...location }, 600);
  },

  getNotificationSettings: (): Promise<NotificationSettings> => mockDelay({ ...settings }),

  updateNotificationSettings: async (
    input: NotificationSettings,
  ): Promise<NotificationSettings> => {
    settings = { ...input };
    return mockDelay({ ...settings }, 600);
  },

  getEligibility: (): Promise<Eligibility> => mockDelay({ ...mockEligibility }),

  getStats: (): Promise<DonorStats> => mockDelay({ ...mockDonorStats }),

  getDonations: (): Promise<DonationRecord[]> => mockDelay(mockDonations.map((d) => ({ ...d }))),

  getAlerts: (): Promise<BloodAlert[]> => mockDelay(alerts.map((a) => ({ ...a }))),

  getAlert: async (id: string): Promise<BloodAlert> => {
    const found = alerts.find((a) => a.id === id);
    if (!found) throw new Error("This blood request could not be found.");
    return mockDelay({ ...found });
  },

  respondToAlert: async (id: string, decision: "accepted" | "declined"): Promise<BloodAlert> => {
    await mockDelay(null, 650);
    alerts = alerts.map((a) => (a.id === id ? { ...a, myResponse: decision } : a));
    const updated = alerts.find((a) => a.id === id);
    if (!updated) throw new Error("This blood request could not be found.");
    return { ...updated };
  },
};

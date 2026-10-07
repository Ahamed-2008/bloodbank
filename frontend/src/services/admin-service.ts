import { mockAdminDonors, mockAdminStats, mockAlerts, mockHospitals } from "@/lib/mock-data";
import type { AdminDonor, AdminStats, BloodAlert, Hospital } from "@/lib/types";
import { mockDelay } from "./api-client";

/**
 * Admin endpoints on the existing NestJS API (to be wired later):
 *   GET   /admin/stats
 *   GET   /admin/hospitals?status=
 *   PATCH /admin/hospitals/:id/verify
 *   PATCH /admin/hospitals/:id/reject   -> { reason }
 *   GET   /admin/donors?search=
 *   GET   /admin/alerts?status=open
 */

let hospitals: Hospital[] = mockHospitals.map((h) => ({ ...h }));

export const adminService = {
  getStats: (): Promise<AdminStats> => mockDelay({ ...mockAdminStats }),

  getHospitals: (): Promise<Hospital[]> => mockDelay(hospitals.map((h) => ({ ...h }))),

  getHospital: async (id: string): Promise<Hospital> => {
    const found = hospitals.find((h) => h.id === id);
    if (!found) throw new Error("Hospital not found.");
    return mockDelay({ ...found });
  },

  approveHospital: async (id: string): Promise<void> => {
    await mockDelay(null, 600);
    hospitals = hospitals.map((h) => {
      if (h.id !== id) return h;
      const next: Hospital = { ...h, verificationStatus: "verified" };
      delete next.rejectionReason;
      return next;
    });
  },

  rejectHospital: async (id: string, reason: string): Promise<void> => {
    await mockDelay(null, 600);
    hospitals = hospitals.map((h) =>
      h.id === id ? { ...h, verificationStatus: "rejected", rejectionReason: reason } : h,
    );
  },

  getDonors: (): Promise<AdminDonor[]> => mockDelay(mockAdminDonors.map((d) => ({ ...d }))),

  getActiveAlerts: (): Promise<BloodAlert[]> =>
    mockDelay(mockAlerts.filter((a) => a.status === "open").map((a) => ({ ...a }))),
};

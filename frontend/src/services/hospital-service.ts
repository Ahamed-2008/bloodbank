import {
  mockAlerts,
  mockHospital,
  mockHospitalStats,
  mockResponses,
  mockStaff,
} from "@/lib/mock-data";
import type {
  BloodAlert,
  DonorResponse,
  Hospital,
  HospitalStats,
  StaffMember,
} from "@/lib/types";
import { mockDelay } from "./api-client";

/**
 * Hospital endpoints on the existing NestJS API (to be wired later):
 *   GET   /hospitals/me                 -> hospital profile
 *   GET   /hospitals/me/stats           -> dashboard stats
 *   GET   /hospitals/me/alerts          -> alerts created by this hospital
 *   POST  /alerts                       -> CreateBloodAlertDto
 *   GET   /alerts/:id/responses         -> donor responses
 *   POST  /alerts/:id/responses/:rid/confirm
 *   PATCH /alerts/:id/cancel            -> { reason }
 *   GET/POST /hospitals/me/staff        -> staff management
 */

export interface CreateAlertInput {
  bloodGroup: string;
  unitsRequired: number;
  urgency: string;
  patientCondition: string;
  neededBy: string;
  contactPhone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  radiusKm: number;
  notes?: string;
}

let alerts: BloodAlert[] = mockAlerts.map((a) => ({ ...a }));
let responses: DonorResponse[] = mockResponses.map((r) => ({ ...r }));
let staff: StaffMember[] = mockStaff.map((s) => ({ ...s }));

export const hospitalService = {
  getHospital: (): Promise<Hospital> => mockDelay({ ...mockHospital }),

  getStats: (): Promise<HospitalStats> => mockDelay({ ...mockHospitalStats }),

  getAlerts: (): Promise<BloodAlert[]> => mockDelay(alerts.map((a) => ({ ...a }))),

  getAlert: async (id: string): Promise<BloodAlert> => {
    const found = alerts.find((a) => a.id === id);
    if (!found) throw new Error("This alert could not be found.");
    return mockDelay({ ...found });
  },

  getResponses: (alertId: string): Promise<DonorResponse[]> =>
    mockDelay(responses.filter((r) => r.alertId === alertId).map((r) => ({ ...r }))),

  getRecentResponses: (): Promise<DonorResponse[]> =>
    mockDelay(responses.slice(0, 4).map((r) => ({ ...r }))),

  createAlert: async (input: CreateAlertInput): Promise<BloodAlert> => {
    await mockDelay(null, 750);
    const created: BloodAlert = {
      id: `alt_${Math.floor(Math.random() * 9000 + 1000)}`,
      bloodGroup: input.bloodGroup as BloodAlert["bloodGroup"],
      unitsRequired: input.unitsRequired,
      unitsFulfilled: 0,
      urgency: input.urgency as BloodAlert["urgency"],
      status: "open",
      hospitalId: mockHospital.id,
      hospitalName: mockHospital.name,
      city: input.city,
      state: input.state,
      address: input.address,
      distanceKm: 0,
      patientCondition: input.patientCondition,
      neededBy: input.neededBy,
      createdAt: new Date().toISOString(),
      contactPhone: input.contactPhone,
      responseCount: 0,
    };
    alerts = [created, ...alerts];
    return created;
  },

  confirmDonation: async (alertId: string, responseId: string): Promise<void> => {
    await mockDelay(null, 600);
    responses = responses.map((r) => (r.id === responseId ? { ...r, status: "confirmed" } : r));
    alerts = alerts.map((a) =>
      a.id === alertId
        ? { ...a, unitsFulfilled: Math.min(a.unitsRequired, a.unitsFulfilled + 1) }
        : a,
    );
  },

  cancelAlert: async (alertId: string, reason: string): Promise<void> => {
    await mockDelay(null, 600);
    alerts = alerts.map((a) =>
      a.id === alertId ? { ...a, status: "cancelled", cancellationReason: reason } : a,
    );
  },

  getStaff: (): Promise<StaffMember[]> => mockDelay(staff.map((s) => ({ ...s }))),

  addStaff: async (input: Omit<StaffMember, "id" | "addedAt">): Promise<StaffMember> => {
    await mockDelay(null, 650);
    const created: StaffMember = {
      ...input,
      id: `stf_${Math.floor(Math.random() * 900 + 100)}`,
      addedAt: new Date().toISOString().slice(0, 10),
    };
    staff = [...staff, created];
    return created;
  },
};

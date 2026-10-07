import type { AuthUser, Role } from "@/lib/types";
import { mockDelay } from "./api-client";

/**
 * MOCK auth. Replace bodies with:
 *   POST /auth/otp/request  { phone }
 *   POST /auth/otp/verify   { phone, otp } -> { accessToken, user }
 */

export const MOCK_OTP = "123456";

const DEMO_USERS: Record<Role, AuthUser> = {
  donor: {
    id: "dnr_1042",
    name: "Ananya Sharma",
    phone: "+91 98450 21188",
    role: "donor",
  },
  hospital_staff: {
    id: "stf_301",
    name: "Dr. Vikram Menon",
    phone: "+91 98800 12345",
    role: "hospital_staff",
    hospitalName: "Manipal Central Hospital",
  },
  admin: {
    id: "adm_001",
    name: "Nisha Grover",
    phone: "+91 90000 00001",
    role: "admin",
  },
};

export const authService = {
  async requestOtp(phone: string): Promise<{ sent: true; expiresInSeconds: number }> {
    if (!/^\d{10}$/.test(phone.replace(/\D/g, "").slice(-10))) {
      throw new Error("Enter a valid 10-digit mobile number.");
    }
    return mockDelay({ sent: true as const, expiresInSeconds: 60 }, 700);
  },

  async verifyOtp(phone: string, otp: string, role: Role): Promise<AuthUser> {
    await mockDelay(null, 700);
    if (otp !== MOCK_OTP) {
      throw new Error("That code doesn't match. Use 123456 for this demo.");
    }
    const base = DEMO_USERS[role];
    return { ...base, phone: phone || base.phone };
  },
};

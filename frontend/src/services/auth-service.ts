import type { AuthResponse, Role } from "@/lib/types";
import { apiRequest } from "./api-client";

export interface DemoAccount {
  label: string;
  phone: string;
  otp: string;
  role: Role;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { label: "Donor 1", phone: "+919999900001", otp: "111111", role: "donor" },
  { label: "Donor 2", phone: "+919999900002", otp: "111111", role: "donor" },
  { label: "Hospital Staff", phone: "+919999900003", otp: "222222", role: "hospital_staff" },
  { label: "Admin", phone: "+919999900004", otp: "333333", role: "admin" },
];

export interface JwtPayload {
  sub: string;
  phone: string;
  role: Role;
  hospital_id?: string;
  staff_role?: string;
  admin_role?: string;
  iat?: number;
  exp?: number;
}

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return null;
  }
}

export const authService = {
  /**
   * Signs in using seeded demo credentials (POST /auth/demo-sign-in).
   */
  async signInWithDemo(phone: string, otp: string): Promise<AuthResponse> {
    return apiRequest<AuthResponse>("/auth/demo-sign-in", {
      method: "POST",
      body: { phone, otp },
    });
  },

  /**
   * Signs in using a verified Firebase ID token (POST /auth/sign-in).
   */
  async signInWithFirebase(idToken: string): Promise<AuthResponse> {
    return apiRequest<AuthResponse>("/auth/sign-in", {
      method: "POST",
      body: { idToken },
    });
  },
};

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AuthUser, Role } from "./types";
import { getAuthToken, setAuthToken, subscribeUnauthorized } from "@/services/api-client";
import { decodeJwt } from "@/services/auth-service";

const USER_STORAGE_KEY = "bloodlink.user";

export const ROLE_HOME: Record<Role, string> = {
  donor: "/donor",
  hospital_staff: "/hospital",
  admin: "/admin",
};

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (user: AuthUser, token: string) => void;
  signOut: () => void;
  updateCurrentUser: (patch: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const signOut = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(USER_STORAGE_KEY);
    }
    setAuthToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    // Subscribe to 401 Unauthorized events from api-client
    const unsubscribe = subscribeUnauthorized(() => {
      signOut();
    });

    try {
      const token = getAuthToken();
      const rawUser = window.localStorage.getItem(USER_STORAGE_KEY);

      if (token && rawUser) {
        const decoded = decodeJwt(token);
        // If JWT has exp, check expiration (exp is in seconds)
        if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
          signOut();
        } else {
          setUser(JSON.parse(rawUser) as AuthUser);
        }
      } else {
        // Clear mismatched state
        signOut();
      }
    } catch {
      signOut();
    } finally {
      setIsLoading(false);
    }

    return () => {
      unsubscribe();
    };
  }, [signOut]);

  const signIn = useCallback((next: AuthUser, token: string) => {
    setAuthToken(token);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(next));
    }
    setUser(next);
  }, []);

  const updateCurrentUser = useCallback((patch: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...patch };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      signIn,
      signOut,
      updateCurrentUser,
    }),
    [user, isLoading, signIn, signOut, updateCurrentUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

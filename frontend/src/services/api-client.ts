/**
 * Thin HTTP client for the existing NestJS REST API.
 *
 * Nothing in the UI talks to `fetch` directly — every screen calls a service in
 * `src/services/*.ts`. Those services currently resolve mock data, and each one
 * documents the endpoint it will call. When the backend is wired up, swap the
 * mock body for `apiRequest(...)` and the UI keeps working unchanged.
 */

export const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "/api";

const TOKEN_STORAGE_KEY = "bloodlink.token";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  else window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, signal } = options;

  const url = new URL(`${API_BASE_URL}${path}`, "http://localhost");
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  const token = getAuthToken();
  const response = await fetch(`${url.pathname}${url.search}`, {
    method,
    signal: signal ?? null,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? null : JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new ApiError(message || "Request failed", response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** Simulates network latency so loading states are exercised while on mock data. */
export function mockDelay<T>(data: T, ms = 450): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

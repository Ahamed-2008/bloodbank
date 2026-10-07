/**
 * HTTP API client for the BloodConnect REST API.
 * Follows the API contract in docs/API.md.
 */

export const API_BASE_URL =
  import.meta.env["VITE_API_BASE_URL"] ?? "http://localhost:3000/api/v1";

const TOKEN_STORAGE_KEY = "bloodlink.token";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  else window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export class ApiError extends Error {
  statusCode: number;
  errorType?: string;
  details?: string[];

  constructor(message: string, statusCode: number, errorType?: string, details?: string[]) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.details = details;
  }
}

export function formatApiError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.details && err.details.length > 0) {
      return err.details.join(", ");
    }
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "An unexpected error occurred. Please try again.";
}

export type UnauthorizedCallback = () => void;
const unauthorizedListeners = new Set<UnauthorizedCallback>();

export function subscribeUnauthorized(callback: UnauthorizedCallback): () => void {
  unauthorizedListeners.add(callback);
  return () => {
    unauthorizedListeners.delete(callback);
  };
}

export interface ApiRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, headers: extraHeaders, signal } = options;

  const base = API_BASE_URL.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${cleanPath}`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extraHeaders ?? {}),
  };

  const response = await fetch(url.toString(), {
    method,
    signal: signal ?? null,
    headers,
    body: body === undefined ? null : JSON.stringify(body),
  });

  if (!response.ok) {
    let message = response.statusText || `Request failed (${response.status})`;
    let details: string[] | undefined;
    let errorType: string | undefined;

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        const errorData = (await response.json()) as {
          statusCode?: number;
          message?: string | string[];
          error?: string;
        };
        if (Array.isArray(errorData.message)) {
          details = errorData.message;
          message = errorData.message.join(", ");
        } else if (typeof errorData.message === "string") {
          message = errorData.message;
        }
        if (typeof errorData.error === "string") {
          errorType = errorData.error;
        }
      } catch {
        // Fallback to status text
      }
    } else {
      const text = await response.text().catch(() => "");
      if (text) message = text;
    }

    if (response.status === 401) {
      setAuthToken(null);
      for (const listener of unauthorizedListeners) {
        listener();
      }
    }

    throw new ApiError(message, response.status, errorType, details);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

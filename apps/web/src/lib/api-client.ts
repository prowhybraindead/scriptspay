import { createClient } from "@/lib/supabase/client";

const RAW_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface ApiRequestInit extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>;
}

function getApiBaseUrl(): string {
  const normalized = RAW_API_BASE_URL.trim().replace(/\/+$/, "");
  return normalized.endsWith("/api") ? normalized : `${normalized}/api`;
}

/**
 * Authenticated fetch wrapper.
 * Retrieves the current Supabase session and attaches the JWT
 * as `Authorization: Bearer <token>` on every outgoing request
 * to the NestJS API.
 */
export async function apiClient<T = unknown>(
  path: string,
  init: ApiRequestInit = {},
): Promise<T> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...init.headers,
  };

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const res = await fetch(`${getApiBaseUrl()}${normalizedPath}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message ?? res.statusText, body);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

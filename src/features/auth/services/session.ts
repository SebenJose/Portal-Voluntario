import "server-only";

import { z } from "zod";
import { authUserSchema, type AuthUser } from "@/features/auth/schemas/session-schema";
import { BackendApiError, backendData, backendRequest } from "@/lib/server/backend-api";

export const SESSION_COOKIE_NAME = "portal_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 8;

export async function verifySessionToken(token: string | undefined): Promise<AuthUser | null> {
  if (!token) return null;
  try {
    const result = await backendData("/auth/session", z.object({ user: authUserSchema }), { token });
    return result.user;
  } catch (error: unknown) {
    if (error instanceof BackendApiError && error.status === 401) return null;
    throw error;
  }
}

export async function revokeSessionToken(token: string | undefined): Promise<void> {
  if (!token) return;
  try {
    await backendRequest("/auth/logout", { method: "POST", token });
  } catch (error: unknown) {
    if (!(error instanceof BackendApiError && error.status === 401)) throw error;
  }
}

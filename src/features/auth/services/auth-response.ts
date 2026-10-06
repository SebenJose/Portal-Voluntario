import { NextRequest, NextResponse } from "next/server";

import type { AuthUser } from "@/features/auth/schemas/session-schema";
import { SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS } from "@/features/auth/services/session";

type SignedSession = { token: string; expiresAt: Date };

export function authResponse(request: NextRequest, user: AuthUser, session: SignedSession, status = 200): NextResponse {
  const response = NextResponse.json({ user }, { status, headers: { "Cache-Control": "no-store" } });
  response.cookies.set(SESSION_COOKIE_NAME, session.token, {
    httpOnly: true,
    secure: new URL(request.url).protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
    expires: session.expiresAt,
  });
  return response;
}

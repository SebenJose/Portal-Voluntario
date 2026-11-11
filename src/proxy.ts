import { NextRequest, NextResponse } from "next/server";

import { BackendApiError } from "@/lib/server/backend-api";
import type { AuthUser } from "@/features/auth/schemas/session-schema";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/features/auth/services/session";

export async function proxy(request: NextRequest) {
  let user: AuthUser | null;
  try {
    user = await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  } catch (error: unknown) {
    // Pages repeat authentication and render the error boundary when the API is unavailable.
    if (error instanceof BackendApiError) return NextResponse.next();
    throw error;
  }
  if (user) {
    if (request.nextUrl.pathname.startsWith("/organizacao") && user.role !== "organization") {
      return NextResponse.redirect(new URL("/painel", request.url));
    }
    return NextResponse.next();
  }

  const loginUrl = new URL("/entrar", request.url);
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/painel/:path*", "/organizacao/:path*", "/certificados/:path*", "/minhas-atividades/:path*"],
};

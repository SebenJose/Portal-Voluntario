import { NextRequest, NextResponse } from "next/server";

import { BackendApiError } from "@/lib/server/backend-api";
import { canAccessPath, homePathFor } from "@/features/auth/lib/access";
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
    if (!canAccessPath(request.nextUrl.pathname, user.role)) {
      return NextResponse.redirect(new URL(homePathFor(user.role), request.url));
    }
    return NextResponse.next();
  }

  const loginUrl = new URL("/entrar", request.url);
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

// Must stay literal for Next's static analysis; keep in sync with protectedRoutes in access.ts.
export const config = {
  matcher: ["/painel/:path*", "/organizacao/:path*", "/certificados/:path*", "/minhas-atividades/:path*", "/administracao/:path*", "/conta/:path*"],
};

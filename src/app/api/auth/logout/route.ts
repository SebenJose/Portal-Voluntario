import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, revokeSessionToken } from "@/features/auth/services/session";
import { applicationOrigin, requireMutationOrigin, securityErrorResponse } from "@/lib/server/request-security";

export async function POST(request: NextRequest) {
  try {
    requireMutationOrigin(request);
    await revokeSessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
    const response = new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      secure: new URL(applicationOrigin(request)).protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
    return response;
  } catch (error: unknown) {
    return securityErrorResponse(error, "Não foi possível encerrar a sessão. Tente novamente.");
  }
}

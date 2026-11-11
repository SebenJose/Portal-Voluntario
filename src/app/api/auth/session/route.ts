import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/features/auth/services/session";
import { backendErrorResponse } from "@/lib/server/backend-route";

export async function GET(request: NextRequest) {
  try {
    const user = await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
    if (!user) return NextResponse.json({ error: "Sessão ausente ou expirada." }, { status: 401, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
  } catch (error: unknown) { return backendErrorResponse(error); }
}

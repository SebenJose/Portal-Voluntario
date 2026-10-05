import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, verifySessionToken } from "@/features/auth/services/session";

export async function GET() {
  const cookieStore = await cookies();
  const user = await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!user) {
    return NextResponse.json(
      { error: "Sessão ausente ou expirada." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
}

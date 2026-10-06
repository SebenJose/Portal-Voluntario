import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, verifySessionToken } from "@/features/auth/services/session";
import { getOpportunityCatalog } from "@/features/opportunities/services/enrollments";

export async function GET() {
  const cookieStore = await cookies();
  const user = await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  try {
    return NextResponse.json(getOpportunityCatalog(user?.id), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ message: "Não foi possível carregar as oportunidades." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, verifySessionToken } from "@/features/auth/services/session";
import { EnrollmentError, enrollInOpportunity } from "@/features/opportunities/services/enrollments";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!user) {
    return NextResponse.json({ message: "Entre na sua conta para se inscrever." }, { status: 401 });
  }
  const { id } = await context.params;
  try {
    return NextResponse.json(enrollInOpportunity(user.id, id), { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error: unknown) {
    if (error instanceof EnrollmentError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Não foi possível concluir a inscrição. Tente novamente." }, { status: 500 });
  }
}

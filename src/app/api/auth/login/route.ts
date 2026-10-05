import { NextRequest, NextResponse } from "next/server";

import { authenticateDemoUser } from "@/features/auth/services/demo-credentials";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
} from "@/features/auth/services/session";
import { loginRequestSchema } from "@/features/auth/schemas/session-schema";

export async function POST(request: NextRequest) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Envie os dados de acesso em formato válido." }, { status: 400 });
  }

  const credentials = loginRequestSchema.safeParse(input);
  if (!credentials.success) {
    return NextResponse.json({ error: "Confira o e-mail e a senha informados." }, { status: 400 });
  }

  const user = authenticateDemoUser(credentials.data);
  if (!user) {
    return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
  }

  try {
    const session = await createSessionToken(user);
    const response = NextResponse.json({ user });
    response.cookies.set(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      secure: new URL(request.url).protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION_SECONDS,
      expires: session.expiresAt,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "O serviço de acesso não está configurado." }, { status: 500 });
  }
}

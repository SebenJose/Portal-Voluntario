import { NextRequest, NextResponse } from "next/server";

import { authenticateAccount } from "@/features/auth/services/accounts";
import { authResponse } from "@/features/auth/services/auth-response";
import { createSessionToken } from "@/features/auth/services/session";
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

  try {
    const user = await authenticateAccount(credentials.data);
    if (!user) {
      return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401 });
    }
    const session = await createSessionToken(user);
    return authResponse(request, user, session);
  } catch {
    return NextResponse.json({ error: "O serviço de acesso está indisponível. Tente novamente." }, { status: 500 });
  }
}

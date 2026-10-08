import { NextRequest, NextResponse } from "next/server";

import { authenticateAccount } from "@/features/auth/services/accounts";
import { authResponse } from "@/features/auth/services/auth-response";
import { createSessionToken } from "@/features/auth/services/session";
import { loginRequestSchema } from "@/features/auth/schemas/session-schema";
import { limitAccountAttempts, limitAuthRequests, readAuthJson, requireMutationOrigin, securityErrorResponse } from "@/lib/server/request-security";

export async function POST(request: NextRequest) {
  try {
    requireMutationOrigin(request);
    limitAuthRequests();
    const credentials = loginRequestSchema.safeParse(await readAuthJson(request));
    if (!credentials.success) {
      return NextResponse.json({ error: "Confira o e-mail e a senha informados." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    limitAccountAttempts(credentials.data.email);
    const user = await authenticateAccount(credentials.data);
    if (!user) {
      return NextResponse.json({ error: "E-mail ou senha incorretos." }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    const session = await createSessionToken(user);
    return authResponse(request, user, session);
  } catch (error: unknown) {
    return securityErrorResponse(error, "O serviço de acesso está indisponível. Tente novamente.");
  }
}

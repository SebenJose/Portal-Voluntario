import { NextRequest, NextResponse } from "next/server";

import { registrationSchema } from "@/features/auth/schemas/registration-schema";
import { AccountAlreadyExistsError, createAccount } from "@/features/auth/services/accounts";
import { limitAccountAttempts, limitAuthRequests, readAuthJson, requireMutationOrigin, securityErrorResponse } from "@/lib/server/request-security";

export async function POST(request: NextRequest) {
  try {
    requireMutationOrigin(request);
    limitAuthRequests();
    const input = registrationSchema.safeParse(await readAuthJson(request));
    if (!input.success) {
      return NextResponse.json({ error: "Confira os dados e a confirmação de senha." }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
    limitAccountAttempts(input.data.email);
    try {
      await createAccount(input.data);
    } catch (error: unknown) {
      if (!(error instanceof AccountAlreadyExistsError)) throw error;
    }
    // Both outcomes perform scrypt and return the same body, status and cookie policy.
    return NextResponse.json(
      { message: "Se os dados permitiram o cadastro, sua conta foi criada. Entre com seu e-mail e senha." },
      { status: 202, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error: unknown) {
    return securityErrorResponse(error, "Não foi possível concluir o cadastro. Tente novamente.");
  }
}

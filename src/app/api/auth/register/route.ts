import { NextRequest, NextResponse } from "next/server";

import { registrationSchema } from "@/features/auth/schemas/registration-schema";
import { AccountAlreadyExistsError, createAccount } from "@/features/auth/services/accounts";
import { authResponse } from "@/features/auth/services/auth-response";

export async function POST(request: NextRequest) {
  const input: unknown = await request.json().catch(() => null);
  const parsedInput = registrationSchema.safeParse(input);
  if (!parsedInput.success) {
    return NextResponse.json({ error: "Confira os dados e a confirmação de senha." }, { status: 400 });
  }

  try {
    const { user, session } = await createAccount(parsedInput.data);
    return authResponse(request, user, session, 201);
  } catch (error: unknown) {
    if (error instanceof AccountAlreadyExistsError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: "Não foi possível criar sua conta. Tente novamente." }, { status: 500 });
  }
}

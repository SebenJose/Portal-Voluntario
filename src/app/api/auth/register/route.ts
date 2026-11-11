import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { registrationSchema } from "@/features/auth/schemas/registration-schema";
import { backendData } from "@/lib/server/backend-api";
import { backendErrorResponse } from "@/lib/server/backend-route";
import { limitRegistrationAttempts, readAuthJson, requireMutationOrigin, RequestSecurityError } from "@/lib/server/request-security";

export async function POST(request: NextRequest) {
  try {
    requireMutationOrigin(request);
    const parsed = registrationSchema.safeParse(await readAuthJson(request));
    if (!parsed.success) throw new RequestSecurityError("Confira os dados e a confirmação de senha.", 400);
    limitRegistrationAttempts(parsed.data.email);
    const result = await backendData("/auth/register", z.object({ message: z.string().min(1) }), { method: "POST", body: parsed.data });
    return NextResponse.json(result, { status: 202, headers: { "Cache-Control": "no-store" } });
  } catch (error: unknown) { return backendErrorResponse(error); }
}

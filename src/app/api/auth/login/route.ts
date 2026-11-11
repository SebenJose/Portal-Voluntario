import { NextRequest } from "next/server";
import { z } from "zod";
import { authUserSchema, loginRequestSchema } from "@/features/auth/schemas/session-schema";
import { authResponse } from "@/features/auth/services/auth-response";
import { BackendApiError, backendData } from "@/lib/server/backend-api";
import { backendErrorResponse } from "@/lib/server/backend-route";
import { assertLoginAllowed, readAuthJson, recordLoginFailure, requireMutationOrigin, RequestSecurityError, resetLoginFailures } from "@/lib/server/request-security";

const loginResponseSchema = z.object({ accessToken: z.string().min(1), expiresAt: z.iso.datetime(), user: authUserSchema });

export async function POST(request: NextRequest) {
  try {
    requireMutationOrigin(request);
    const parsed = loginRequestSchema.safeParse(await readAuthJson(request));
    if (!parsed.success) throw new RequestSecurityError("Confira o e-mail e a senha informados.", 400);
    const { email } = parsed.data;
    assertLoginAllowed(email);
    let result: z.infer<typeof loginResponseSchema>;
    try {
      result = await backendData("/auth/login", loginResponseSchema, { method: "POST", body: parsed.data });
    } catch (error: unknown) {
      if (error instanceof BackendApiError && error.status === 401) recordLoginFailure(email);
      throw error;
    }
    resetLoginFailures(email);
    return authResponse(request, result.user, { token: result.accessToken, expiresAt: new Date(result.expiresAt) });
  } catch (error: unknown) { return backendErrorResponse(error); }
}

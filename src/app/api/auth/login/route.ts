import { NextRequest } from "next/server";
import { z } from "zod";
import { authUserSchema, loginRequestSchema } from "@/features/auth/schemas/session-schema";
import { authResponse } from "@/features/auth/services/auth-response";
import { backendData } from "@/lib/server/backend-api";
import { backendErrorResponse } from "@/lib/server/backend-route";
import { limitAccountAttempts, limitAuthRequests, readAuthJson, requireMutationOrigin, RequestSecurityError } from "@/lib/server/request-security";

const loginResponseSchema = z.object({ accessToken: z.string().min(1), expiresAt: z.iso.datetime(), user: authUserSchema });

export async function POST(request: NextRequest) {
  try {
    requireMutationOrigin(request);
    limitAuthRequests();
    const parsed = loginRequestSchema.safeParse(await readAuthJson(request));
    if (!parsed.success) throw new RequestSecurityError("Confira o e-mail e a senha informados.", 400);
    limitAccountAttempts(parsed.data.email);
    const result = await backendData("/auth/login", loginResponseSchema, { method: "POST", body: parsed.data });
    return authResponse(request, result.user, { token: result.accessToken, expiresAt: new Date(result.expiresAt) });
  } catch (error: unknown) { return backendErrorResponse(error); }
}

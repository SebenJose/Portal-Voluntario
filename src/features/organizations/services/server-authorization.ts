import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/features/auth/services/session";
import { RequestSecurityError, requireMutationOrigin, securityErrorResponse } from "@/lib/server/request-security";

export async function requireOrganizationRequest(request: NextRequest) {
  const user = await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!user) throw new RequestSecurityError("Entre na sua conta.", 401);
  if (user.role !== "organization") throw new RequestSecurityError("Acesso reservado a organizações.", 403);
  return user;
}

export async function organizationBackendUnavailable(request: NextRequest, mutation = false): Promise<NextResponse> {
  try {
    if (mutation) requireMutationOrigin(request);
    await requireOrganizationRequest(request);
    return NextResponse.json(
      { message: "A gestão de atividades está disponível somente na demonstração. O serviço ainda não está integrado." },
      { status: 501, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error: unknown) {
    return securityErrorResponse(error, "Não foi possível verificar o acesso.");
  }
}

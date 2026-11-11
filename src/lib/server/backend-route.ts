import "server-only";
import { NextRequest, NextResponse } from "next/server";
import type { z } from "zod";
import { SESSION_COOKIE_NAME } from "@/features/auth/services/session";
import { BackendApiError, backendData, backendRequest } from "@/lib/server/backend-api";
import { readAuthJson, requireMutationOrigin, securityErrorResponse } from "@/lib/server/request-security";

export function backendErrorResponse(error: unknown): NextResponse {
  if (error instanceof BackendApiError) {
    return NextResponse.json({ message: error.message, error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
  }
  return securityErrorResponse(error, "Não foi possível concluir a solicitação. Tente novamente.");
}

export async function forwardApi<T>(request: NextRequest, path: string, schema: z.ZodType<T>, status = 200): Promise<NextResponse> {
  try {
    const method = request.method;
    if (method !== "GET" && method !== "POST" && method !== "PATCH" && method !== "DELETE") return new NextResponse(null, { status: 405 });
    if (method !== "GET") requireMutationOrigin(request);
    const body = (method === "POST" || method === "PATCH") && request.headers.get("content-type")?.includes("application/json")
      ? await readAuthJson(request) : undefined;
    const result = await backendData(path, schema, { method, body, token: request.cookies.get(SESSION_COOKIE_NAME)?.value });
    return NextResponse.json(result, { status, headers: { "Cache-Control": "no-store" } });
  } catch (error: unknown) { return backendErrorResponse(error); }
}

export async function forwardDelete(request: NextRequest, path: string): Promise<NextResponse> {
  try {
    requireMutationOrigin(request);
    const response = await backendRequest(path, { method: "DELETE", token: request.cookies.get(SESSION_COOKIE_NAME)?.value });
    if (response.status !== 204) throw new BackendApiError("O serviço retornou uma confirmação inválida.", 502);
    return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch (error: unknown) { return backendErrorResponse(error); }
}

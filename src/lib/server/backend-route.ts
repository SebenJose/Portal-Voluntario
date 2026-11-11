import "server-only";
import { NextRequest, NextResponse } from "next/server";
import type { z } from "zod";
import { certificateBlobSchema } from "@/features/certificates/schemas/certificate-schema";
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
  return forwardNoContent(request, path);
}

/** Mutação que o backend confirma com 204 (DELETE, ou PATCH com corpo JSON). */
export async function forwardNoContent(request: NextRequest, path: string): Promise<NextResponse> {
  try {
    const method = request.method;
    if (method !== "PATCH" && method !== "DELETE") return new NextResponse(null, { status: 405 });
    requireMutationOrigin(request);
    const body = method === "PATCH" ? await readAuthJson(request) : undefined;
    const response = await backendRequest(path, { method, body, token: request.cookies.get(SESSION_COOKIE_NAME)?.value });
    if (response.status !== 204) throw new BackendApiError("O serviço retornou uma confirmação inválida.", 502);
    return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch (error: unknown) { return backendErrorResponse(error); }
}

/** Repassa um comprovante binário do backend, mantendo apenas tipos e anexos permitidos. */
export async function forwardDocument(request: NextRequest, path: string): Promise<NextResponse> {
  try {
    const response = await backendRequest(path, { token: request.cookies.get(SESSION_COOKIE_NAME)?.value });
    const blob = certificateBlobSchema.safeParse(await response.blob());
    if (!blob.success) throw new BackendApiError("O serviço retornou um comprovante inválido.", 502);
    const headers: Record<string, string> = { "Content-Type": blob.data.type, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
    const disposition = response.headers.get("content-disposition");
    if (disposition?.startsWith("attachment;")) headers["Content-Disposition"] = disposition;
    return new NextResponse(blob.data, { headers });
  } catch (error: unknown) { return backendErrorResponse(error); }
}

/** Mantém somente os query params conhecidos ao repassar listagens. */
export function pickQuery(request: NextRequest, keys: readonly string[]): string {
  const query = new URLSearchParams();
  for (const key of keys) {
    const value = request.nextUrl.searchParams.get(key);
    if (value !== null) query.set(key, value);
  }
  return query.size > 0 ? `?${query.toString()}` : "";
}

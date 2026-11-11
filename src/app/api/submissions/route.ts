import { NextRequest, NextResponse } from "next/server";
import { certificateListSchema, certificateRecordSchema } from "@/features/certificates/schemas/certificate-schema";
import { SESSION_COOKIE_NAME } from "@/features/auth/services/session";
import { backendData } from "@/lib/server/backend-api";
import { backendErrorResponse, forwardApi } from "@/lib/server/backend-route";
import { readRequestBytes, requireMutationOrigin, RequestSecurityError } from "@/lib/server/request-security";

export async function GET(request: NextRequest) { return forwardApi(request, "/submissions", certificateListSchema); }

export async function POST(request: NextRequest) {
  try {
    requireMutationOrigin(request);
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) throw new RequestSecurityError("Entre na sua conta.", 401);
    const contentType = request.headers.get("content-type");
    if (!contentType?.toLowerCase().startsWith("multipart/form-data;")) throw new RequestSecurityError("Envie os dados e o comprovante em formulário.", 415);
    const bytes = await readRequestBytes(request, 5 * 1024 * 1024 + 64 * 1024);
    const form = await new Request(request.url, { method: "POST", headers: { "Content-Type": contentType }, body: bytes }).formData()
      .catch(() => { throw new RequestSecurityError("O formulário enviado é inválido.", 400); });
    const result = await backendData("/submissions", certificateRecordSchema, { method: "POST", token, body: form });
    return NextResponse.json(result, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error: unknown) { return backendErrorResponse(error); }
}

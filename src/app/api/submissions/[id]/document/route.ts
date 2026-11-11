import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/features/auth/services/session";
import { certificateBlobSchema } from "@/features/certificates/schemas/certificate-schema";
import { BackendApiError, backendRequest } from "@/lib/server/backend-api";
import { backendErrorResponse } from "@/lib/server/backend-route";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const response = await backendRequest(`/submissions/${encodeURIComponent(id)}/document`, { token: request.cookies.get(SESSION_COOKIE_NAME)?.value });
    const blob = certificateBlobSchema.safeParse(await response.blob());
    if (!blob.success) throw new BackendApiError("O serviço retornou um comprovante inválido.", 502);
    const headers: Record<string, string> = { "Content-Type": blob.data.type, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
    const disposition = response.headers.get("content-disposition");
    if (disposition?.startsWith("attachment;")) headers["Content-Disposition"] = disposition;
    return new NextResponse(blob.data, { headers });
  } catch (error: unknown) { return backendErrorResponse(error); }
}

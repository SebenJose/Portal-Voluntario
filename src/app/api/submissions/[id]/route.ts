import { NextRequest } from "next/server";
import { certificateRecordSchema } from "@/features/certificates/schemas/certificate-schema";
import { forwardApi, forwardDelete } from "@/lib/server/backend-route";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: NextRequest, context: Context) {
  return forwardApi(request, `/submissions/${encodeURIComponent((await context.params).id)}`, certificateRecordSchema);
}
export async function PATCH(request: NextRequest, context: Context) {
  return forwardApi(request, `/submissions/${encodeURIComponent((await context.params).id)}`, certificateRecordSchema);
}
export async function DELETE(request: NextRequest, context: Context) {
  return forwardDelete(request, `/submissions/${encodeURIComponent((await context.params).id)}`);
}

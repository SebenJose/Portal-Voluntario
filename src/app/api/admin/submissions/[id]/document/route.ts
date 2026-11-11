import { NextRequest } from "next/server";
import { forwardDocument } from "@/lib/server/backend-route";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return forwardDocument(request, `/admin/submissions/${encodeURIComponent(id)}/document`);
}

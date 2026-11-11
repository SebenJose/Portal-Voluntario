import { NextRequest } from "next/server";
import { opportunitySchema } from "@/features/opportunities/schemas/opportunity-schema";
import { forwardApi, forwardDelete } from "@/lib/server/backend-route";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: NextRequest, context: Context) {
  return forwardApi(request, `/opportunities/${encodeURIComponent((await context.params).id)}`, opportunitySchema);
}
export async function PATCH(request: NextRequest, context: Context) {
  return forwardApi(request, `/opportunities/${encodeURIComponent((await context.params).id)}`, opportunitySchema);
}
export async function DELETE(request: NextRequest, context: Context) {
  return forwardDelete(request, `/opportunities/${encodeURIComponent((await context.params).id)}`);
}

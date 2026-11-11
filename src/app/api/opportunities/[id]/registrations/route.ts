import { NextRequest } from "next/server";
import { registrationResponseSchema, cancellationResponseSchema } from "@/features/opportunities/schemas/opportunity-schema";
import { forwardApi } from "@/lib/server/backend-route";

type Context = { params: Promise<{ id: string }> };
export async function POST(request: NextRequest, context: Context) {
  const { id } = await context.params;
  return forwardApi(request, `/opportunities/${encodeURIComponent(id)}/registrations`, registrationResponseSchema, 201);
}
export async function DELETE(request: NextRequest, context: Context) {
  const { id } = await context.params;
  return forwardApi(request, `/opportunities/${encodeURIComponent(id)}/registrations`, cancellationResponseSchema);
}

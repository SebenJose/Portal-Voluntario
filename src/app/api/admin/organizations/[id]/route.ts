import { NextRequest } from "next/server";
import { managedOrganizationSchema } from "@/features/admin/schemas/admin-schema";
import { forwardApi } from "@/lib/server/backend-route";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return forwardApi(request, `/admin/organizations/${encodeURIComponent(id)}`, managedOrganizationSchema);
}

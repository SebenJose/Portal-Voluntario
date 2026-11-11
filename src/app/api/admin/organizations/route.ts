import { NextRequest } from "next/server";
import { managedOrganizationListSchema } from "@/features/admin/schemas/admin-schema";
import { forwardApi, pickQuery } from "@/lib/server/backend-route";

export async function GET(request: NextRequest) {
  return forwardApi(request, `/admin/organizations${pickQuery(request, ["status"])}`, managedOrganizationListSchema);
}

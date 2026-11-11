import { NextRequest } from "next/server";
import { certificateDispatchSchema } from "@/features/organizations/services/organization-activities";
import { forwardApi } from "@/lib/server/backend-route";
export async function POST(request: NextRequest, context: { params: Promise<{ activityId: string }> }) {
  const { activityId } = await context.params;
  return forwardApi(request, `/organizations/activities/${encodeURIComponent(activityId)}/certificates`, certificateDispatchSchema, 201);
}

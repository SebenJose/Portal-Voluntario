import { NextRequest } from "next/server";
import { attendanceUpdateSchema } from "@/features/organizations/services/organization-activities";
import { forwardApi } from "@/lib/server/backend-route";
export async function PATCH(request: NextRequest, context: { params: Promise<{ activityId: string; participantId: string }> }) {
  const { activityId, participantId } = await context.params;
  return forwardApi(request, `/organizations/activities/${encodeURIComponent(activityId)}/participants/${encodeURIComponent(participantId)}`, attendanceUpdateSchema);
}

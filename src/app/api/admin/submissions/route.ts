import { NextRequest } from "next/server";
import { reviewSubmissionListSchema } from "@/features/admin/schemas/admin-schema";
import { forwardApi, pickQuery } from "@/lib/server/backend-route";

export async function GET(request: NextRequest) {
  return forwardApi(request, `/admin/submissions${pickQuery(request, ["status"])}`, reviewSubmissionListSchema);
}

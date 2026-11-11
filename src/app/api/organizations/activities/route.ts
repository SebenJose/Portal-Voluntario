import { NextRequest } from "next/server";
import { activityListSchema } from "@/features/organizations/services/organization-activities";
import { forwardApi } from "@/lib/server/backend-route";
export async function GET(request: NextRequest) { return forwardApi(request, "/organizations/activities", activityListSchema); }

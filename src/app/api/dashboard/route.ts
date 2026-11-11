import { NextRequest } from "next/server";
import { dashboardSummarySchema } from "@/features/dashboard/schemas/dashboard-schema";
import { forwardApi } from "@/lib/server/backend-route";
export async function GET(request: NextRequest) { return forwardApi(request, "/dashboard", dashboardSummarySchema); }

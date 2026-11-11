import { NextRequest } from "next/server";
import { opportunitiesResponseSchema, opportunitySchema } from "@/features/opportunities/schemas/opportunity-schema";
import { forwardApi } from "@/lib/server/backend-route";

export async function GET(request: NextRequest) {
  return forwardApi(request, `/opportunities${request.nextUrl.search}`, opportunitiesResponseSchema);
}

export async function POST(request: NextRequest) { return forwardApi(request, "/opportunities", opportunitySchema, 201); }

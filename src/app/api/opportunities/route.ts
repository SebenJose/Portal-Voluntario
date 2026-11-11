import { NextRequest } from "next/server";
import { opportunitiesResponseSchema, opportunitySchema } from "@/features/opportunities/schemas/opportunity-schema";
import { forwardApi, pickQuery } from "@/lib/server/backend-route";

export async function GET(request: NextRequest) {
  // Forward only the catalogue filters; unrelated parameters (e.g. utm_*) must not turn into API errors.
  return forwardApi(request, `/opportunities${pickQuery(request, ["search", "category", "format", "sort"])}`, opportunitiesResponseSchema);
}

export async function POST(request: NextRequest) { return forwardApi(request, "/opportunities", opportunitySchema, 201); }

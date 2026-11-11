import { NextRequest } from "next/server";
import { opportunitiesResponseSchema, opportunitySchema } from "@/features/opportunities/schemas/opportunity-schema";
import { forwardApi } from "@/lib/server/backend-route";

const catalogQueryKeys = ["search", "category", "format", "sort"] as const;

export async function GET(request: NextRequest) {
  // Forward only the catalogue filters; unrelated parameters (e.g. utm_*) must not turn into API errors.
  const query = new URLSearchParams();
  for (const key of catalogQueryKeys) {
    const value = request.nextUrl.searchParams.get(key);
    if (value !== null) query.set(key, value);
  }
  return forwardApi(request, query.size > 0 ? `/opportunities?${query.toString()}` : "/opportunities", opportunitiesResponseSchema);
}

export async function POST(request: NextRequest) { return forwardApi(request, "/opportunities", opportunitySchema, 201); }

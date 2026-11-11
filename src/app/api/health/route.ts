import { NextRequest } from "next/server";
import { z } from "zod";
import { forwardApi } from "@/lib/server/backend-route";

export async function GET(request: NextRequest) {
  return forwardApi(request, "/health", z.object({ status: z.literal("ok"), database: z.literal("up") }));
}

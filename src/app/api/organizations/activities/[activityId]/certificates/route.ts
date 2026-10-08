import { NextRequest } from "next/server";
import { organizationBackendUnavailable } from "@/features/organizations/services/server-authorization";

export async function POST(request: NextRequest) {
  return organizationBackendUnavailable(request, true);
}

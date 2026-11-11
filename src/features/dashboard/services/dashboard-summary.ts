import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/features/auth/services/session";
import { backendData } from "@/lib/server/backend-api";
import { dashboardSummarySchema } from "@/features/dashboard/schemas/dashboard-schema";
export type { DashboardSummary } from "@/features/dashboard/schemas/dashboard-schema";

export async function getDashboardSummary() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  return backendData("/dashboard", dashboardSummarySchema, { token });
}

import { DashboardPage } from "@/features/dashboard";
import { requireAuthenticatedUser } from "@/features/auth/services/server-session";
import { getDashboardSummary } from "@/features/dashboard/services/dashboard-summary";

export default async function Page() {
  const user = await requireAuthenticatedUser("/painel");
  return <DashboardPage summary={getDashboardSummary(user.id)} user={user} />;
}

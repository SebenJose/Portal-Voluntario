import { DashboardPage } from "@/features/dashboard";
import { requireAuthenticatedUser } from "@/features/auth/services/server-session";

export default async function Page() {
  const user = await requireAuthenticatedUser("/painel");
  return <DashboardPage user={user} />;
}

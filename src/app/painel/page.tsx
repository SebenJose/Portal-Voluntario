import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DashboardPage } from "@/features/dashboard";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/features/auth/services/session";

export default async function Page() {
  const cookieStore = await cookies();
  const user = await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!user) redirect("/entrar?next=%2Fpainel");
  return <DashboardPage user={user} />;
}

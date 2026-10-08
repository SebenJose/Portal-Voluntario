import type { Metadata } from "next";

import { OpportunitiesPage } from "@/features/opportunities";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/features/auth/services/session";

export const metadata: Metadata = { title: "Oportunidades | Portal Voluntário" };

export default async function Page() {
  const cookieStore = await cookies();
  const user = await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  return <OpportunitiesPage user={user} />;
}

import type { Metadata } from "next";

import { AccountPage } from "@/features/account/components/account-page";
import { requirePageAccess } from "@/features/auth/services/server-session";

export const metadata: Metadata = { title: "Minha conta | Portal Voluntário" };

export default async function Page() {
  const user = await requirePageAccess("/conta");
  return <AccountPage user={user} />;
}

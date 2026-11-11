import type { Metadata } from "next";

import { AdminOrganizationsPage } from "@/features/admin/components/admin-organizations-page";
import { requirePageAccess } from "@/features/auth/services/server-session";

export const metadata: Metadata = { title: "Organizações | Administração | Portal Voluntário" };

export default async function Page() {
  const user = await requirePageAccess("/administracao");
  return <AdminOrganizationsPage user={user} />;
}

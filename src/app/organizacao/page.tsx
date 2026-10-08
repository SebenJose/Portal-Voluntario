import type { Metadata } from "next";

import { OrganizationManagementPage } from "@/features/organizations";
import { requireOrganizationUser } from "@/features/auth/services/server-session";

export const metadata: Metadata = { title: "Protótipo de gestão | Portal Voluntário" };

export default async function Page() {
  const user = await requireOrganizationUser();
  return <OrganizationManagementPage user={user} />;
}

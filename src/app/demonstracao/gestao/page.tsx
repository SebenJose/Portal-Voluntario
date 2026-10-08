import type { Metadata } from "next";

import { OrganizationManagementPage } from "@/features/organizations";

export const metadata: Metadata = { title: "Demonstração de gestão | Portal Voluntário" };

export default function Page() {
  return <OrganizationManagementPage mode="public-demo" user={null} />;
}

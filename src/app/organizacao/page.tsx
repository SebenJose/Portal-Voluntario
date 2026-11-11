import type { Metadata } from "next";

import { OrganizationManagementPage } from "@/features/organizations";
import { isApprovedOrganization } from "@/features/auth/lib/access";
import { requireOrganizationUser } from "@/features/auth/services/server-session";
import { OrganizationReviewNotice } from "@/features/organizations/components/organization-review-notice";

export const metadata: Metadata = { title: "Gestão de atividades | Portal Voluntário" };

export default async function Page() {
  const user = await requireOrganizationUser();
  if (!isApprovedOrganization(user)) return <OrganizationReviewNotice active="organization" user={user} />;
  return <OrganizationManagementPage user={user} />;
}

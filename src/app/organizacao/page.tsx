import { OrganizationManagementPage } from "@/features/organizations";
import { requireOrganizationUser } from "@/features/auth/services/server-session";

export default async function Page() {
  const user = await requireOrganizationUser();
  return <OrganizationManagementPage user={user} />;
}

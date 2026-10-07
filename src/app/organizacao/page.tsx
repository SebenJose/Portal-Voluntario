import { OrganizationManagementPage } from "@/features/organizations";
import { requireAuthenticatedUser } from "@/features/auth/services/server-session";

export default async function Page() {
  const user = await requireAuthenticatedUser("/organizacao");
  return <OrganizationManagementPage user={user} />;
}

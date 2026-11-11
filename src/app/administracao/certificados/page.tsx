import type { Metadata } from "next";

import { AdminCertificatesPage } from "@/features/admin/components/admin-certificates-page";
import { requirePageAccess } from "@/features/auth/services/server-session";

export const metadata: Metadata = { title: "Certificados externos | Administração | Portal Voluntário" };

export default async function Page() {
  const user = await requirePageAccess("/administracao/certificados");
  return <AdminCertificatesPage user={user} />;
}

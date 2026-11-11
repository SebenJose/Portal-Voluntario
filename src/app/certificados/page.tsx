import type { Metadata } from "next";

import { requirePageAccess } from "@/features/auth/services/server-session";
import { CertificatesPage } from "@/features/certificates";

export const metadata: Metadata = { title: "Meus certificados | Portal Voluntário" };

export default async function Page() {
  const user = await requirePageAccess("/certificados");
  return <CertificatesPage user={user} />;
}

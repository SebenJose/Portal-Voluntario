import type { Metadata } from "next";

import { requireAuthenticatedUser } from "@/features/auth/services/server-session";
import { CertificatesPage } from "@/features/certificates";

export const metadata: Metadata = { title: "Meus certificados | Portal Voluntário" };

export default async function Page() {
  const user = await requireAuthenticatedUser("/certificados");
  return <CertificatesPage user={user} />;
}

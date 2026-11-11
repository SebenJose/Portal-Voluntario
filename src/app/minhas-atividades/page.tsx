import type { Metadata } from "next";

import { requirePageAccess } from "@/features/auth/services/server-session";
import { MyActivitiesPage } from "@/features/opportunities/components/my-activities-page";

export const metadata: Metadata = { title: "Minhas atividades | Portal Voluntário" };

export default async function Page() {
  const user = await requirePageAccess("/minhas-atividades");
  return <MyActivitiesPage user={user} />;
}

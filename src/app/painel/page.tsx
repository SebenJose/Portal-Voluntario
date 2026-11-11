import type { Metadata } from "next";
import { z } from "zod";

import { DashboardPage } from "@/features/dashboard";
import { isApprovedOrganization } from "@/features/auth/lib/access";
import { requirePageAccess } from "@/features/auth/services/server-session";
import { getDashboardSummary } from "@/features/dashboard/services/dashboard-summary";
import { PresentationDashboard } from "@/features/dashboard/components/presentation-dashboard";
import { OrganizationDashboardPage } from "@/features/organizations/components/organization-dashboard-page";
import { OrganizationReviewNotice } from "@/features/organizations/components/organization-review-notice";
import { isDemoModeEnabled } from "@/lib/demo-mode";

export const metadata: Metadata = { title: "Meu painel | Portal Voluntário" };

export default async function Page({ searchParams }: { searchParams: Promise<{ demonstracao?: string | string[] }> }) {
  const { demonstracao } = await searchParams;
  const mode = z.enum(["horas", "conta"]).optional().safeParse(demonstracao);
  const returnPath = mode.success && mode.data ? `/painel?demonstracao=${mode.data}` : "/painel";
  const user = await requirePageAccess("/painel", returnPath);
  if (user.role === "organization") {
    return isApprovedOrganization(user) ? <OrganizationDashboardPage user={user} /> : <OrganizationReviewNotice active="dashboard" user={user} />;
  }
  const showPresentation = isDemoModeEnabled && mode.success && mode.data === "horas";
  const summary = await getDashboardSummary();
  return showPresentation
    ? <PresentationDashboard summary={summary} user={user} />
    : <DashboardPage summary={summary} user={user} />;
}

import type { Metadata } from "next";
import { z } from "zod";

import { DashboardPage } from "@/features/dashboard";
import { requireAuthenticatedUser } from "@/features/auth/services/server-session";
import { getDashboardSummary } from "@/features/dashboard/services/dashboard-summary";
import { PresentationDashboard } from "@/features/dashboard/components/presentation-dashboard";
import { isDemoModeEnabled } from "@/lib/demo-mode";

export const metadata: Metadata = { title: "Meu painel | Portal Voluntário" };

export default async function Page({ searchParams }: { searchParams: Promise<{ demonstracao?: string | string[] }> }) {
  const { demonstracao } = await searchParams;
  const mode = z.enum(["horas", "conta"]).optional().safeParse(demonstracao);
  const showPresentation = isDemoModeEnabled && mode.success && mode.data !== "conta";
  const returnPath = mode.success && mode.data ? `/painel?demonstracao=${mode.data}` : "/painel";
  const user = await requireAuthenticatedUser(returnPath);
  const summary = getDashboardSummary(user.id);
  return showPresentation
    ? <PresentationDashboard summary={summary} user={user} />
    : <DashboardPage summary={summary} user={user} />;
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { AppRouteSkeleton } from "@/components/layout/route-loading-skeletons";
import { Button } from "@/components/ui/button";
import type { AuthUser } from "@/features/auth/schemas/session-schema";
import { DashboardPage } from "@/features/dashboard/components/dashboard-page";
import type { DashboardPresentation } from "@/features/dashboard/schemas/presentation-schema";
import type { DashboardSummary } from "@/features/dashboard/services/dashboard-summary";
import { getDashboardPresentation } from "@/features/dashboard/services/presentation";

type PresentationState =
  | { status: "loading" }
  | { status: "ready"; data: DashboardPresentation }
  | { status: "error"; message: string };

export function PresentationDashboard({ user, summary }: { user: AuthUser; summary: DashboardSummary }) {
  const [state, setState] = useState<PresentationState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void getDashboardPresentation(controller.signal).then(
      (data) => { if (!controller.signal.aborted) setState({ status: "ready", data }); },
      (error: unknown) => {
        if (!controller.signal.aborted) setState({ status: "error", message: error instanceof Error ? error.message : "Não foi possível carregar os exemplos." });
      },
    );
    return () => controller.abort();
  }, [attempt]);

  if (state.status === "loading") return <AppRouteSkeleton kind="dashboard" title="Demonstração do painel" />;
  if (state.status === "ready") return <DashboardPage presentation={state.data} summary={summary} user={user} />;

  return (
    <AppShell active="dashboard" description="Exemplos de horas e participações para apresentação." title="Demonstração do painel" user={user}>
      <p className="text-sm text-destructive" role="alert">{state.message}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button onClick={() => { setState({ status: "loading" }); setAttempt((current) => current + 1); }}>Tentar novamente</Button>
        <Button nativeButton={false} render={<Link href="/painel?demonstracao=conta" />} variant="outline">Voltar aos meus dados</Button>
      </div>
    </AppShell>
  );
}

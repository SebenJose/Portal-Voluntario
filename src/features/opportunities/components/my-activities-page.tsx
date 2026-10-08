"use client";

import { MotionConfig } from "motion/react";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { OpportunityGridSkeleton } from "@/components/layout/route-loading-skeletons";
import { Button } from "@/components/ui/button";
import type { AuthUser } from "@/features/auth/schemas/session-schema";
import { ActivityAgenda } from "@/features/opportunities/components/activity-agenda";
import { OpportunityCard } from "@/features/opportunities/components/opportunity-card";
import { useOpportunityCatalog } from "@/features/opportunities/hooks/use-opportunity-catalog";

export function MyActivitiesPage({ user }: { user: AuthUser }) {
  const catalog = useOpportunityCatalog(user.id, "/minhas-atividades");
  return (
    <AppShell active="activities" description="Consulte suas inscrições, acompanhe os encontros e gerencie sua participação." title="Minhas atividades" user={user}>
      {catalog.isLoading ? <OpportunityGridSkeleton /> : catalog.loadError ? (
        <section aria-label="Erro ao carregar inscrições" className="space-y-4 rounded-2xl border p-6"><p role="alert">{catalog.loadError}</p><Button onClick={catalog.retry} variant="outline">Tentar novamente</Button></section>
      ) : <div className="space-y-6">
        {catalog.notice ? <p className="text-sm" role="status">{catalog.notice}</p> : null}
        {catalog.mutationError ? <p className="text-sm text-destructive" role="alert">{catalog.mutationError}</p> : null}
        <ActivityAgenda activities={catalog.registeredActivities} />
        <section aria-labelledby="my-registrations-title" className="space-y-5">
          <header className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold" id="my-registrations-title">Minhas inscrições ({catalog.registeredActivities.length})</h2><Button nativeButton={false} render={<Link href="/oportunidades" />} variant="outline">Encontrar oportunidades</Button></header>
          {catalog.registeredActivities.length === 0 ? <p className="rounded-2xl border border-dashed p-8 text-sm text-muted-foreground">Você ainda não está inscrito em nenhuma atividade. Explore as oportunidades para começar.</p> : <MotionConfig reducedMotion="user"><ul className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">{catalog.registeredActivities.map((opportunity) => <li key={opportunity.id}><OpportunityCard canRegister cancellationError={catalog.mutationError} isRegistered isRegistering={catalog.pendingIds.has(opportunity.id)} onCancel={() => catalog.cancel(opportunity.id)} onRegister={(id) => { void catalog.register(id); }} opportunity={opportunity} /></li>)}</ul></MotionConfig>}
        </section>
      </div>}
    </AppShell>
  );
}

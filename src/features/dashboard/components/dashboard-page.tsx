"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarDays, CheckCircle2, Clock3, FlaskConical } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuthUser } from "@/features/auth/schemas/session-schema";
import { DashboardCertificates } from "@/features/dashboard/components/dashboard-certificates";
import { CompletedDemoActivities } from "@/features/dashboard/components/completed-demo-activities";
import type { DashboardPresentation } from "@/features/dashboard/schemas/presentation-schema";
import type { DashboardSummary } from "@/features/dashboard/services/dashboard-summary";
import { isDemoModeEnabled } from "@/lib/demo-mode";
import { ActivityAgenda } from "@/features/opportunities/components/activity-agenda";
import { useOpportunityCatalog } from "@/features/opportunities/hooks/use-opportunity-catalog";
import { formatSessionDate, getAgendaEntries, getNextSessions } from "@/features/opportunities/lib/agenda";
import { activityCategoryStyles } from "@/lib/activity-categories";

export function DashboardPage({ user, summary, presentation }: { user: AuthUser; summary: DashboardSummary; presentation?: DashboardPresentation }) {
  const hoursSummary = presentation?.hoursSummary ?? summary.hoursSummary;
  const catalog = useOpportunityCatalog(user.id, "/painel");
  const activities = presentation?.registeredActivities ?? catalog.registeredActivities;
  const isLoading = !presentation && catalog.isLoading;
  const loadError = presentation ? null : catalog.loadError;
  const [now] = useState(() => new Date());
  const nextSessions = getNextSessions(getAgendaEntries(activities), now).slice(0, 3);
  const totalCompleted = hoursSummary.reduce((total, item) => total + item.completed, 0);

  return (
    <AppShell active="dashboard" description="Acompanhe suas inscrições, seus certificados e os próximos encontros." title="Meu painel" user={user}>
      {presentation ? (
        <aside aria-labelledby="presentation-title" className="mb-5 flex flex-col justify-between gap-4 rounded-2xl border border-brand-yellow/50 bg-brand-yellow/10 p-5 sm:flex-row sm:items-center">
          <div><h2 className="flex items-center gap-2 font-semibold" id="presentation-title"><FlaskConical aria-hidden="true" className="size-4" />Dados de demonstração</h2><p className="mt-1 text-sm text-muted-foreground">Horas, atividades concluídas e agenda fictícias para apresentação.</p></div>
          <Button nativeButton={false} render={<Link href="/painel?demonstracao=conta" />} variant="outline">Voltar aos meus dados</Button>
        </aside>
      ) : isDemoModeEnabled ? (
        <div className="mb-5 flex justify-end"><Button nativeButton={false} render={<Link href="/painel" />} variant="outline"><FlaskConical aria-hidden="true" />Ver dados de demonstração</Button></div>
      ) : null}
      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
        <Card aria-labelledby="hours-bank-title" as="section" className="overflow-hidden border-brand-black bg-brand-black text-white shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-sm font-medium text-white/70" id="hours-bank-title">Banco de horas</h2>
                <p className="mt-2 text-5xl font-semibold tracking-tight">{totalCompleted}h</p>
                <p className="mt-2 text-sm text-white/70">{presentation ? "Exemplo de horas homologadas em atividades concluídas." : "Horas homologadas no portal. Envios em análise não entram neste total."}</p>
              </div>
              <div className="rounded-2xl border border-brand-yellow/30 bg-brand-yellow px-4 py-3 text-brand-black">
                <CheckCircle2 aria-hidden="true" className="size-7" />
                <p className="mt-3 text-sm font-medium">Acompanhe sua jornada</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card aria-labelledby="participations-title" as="section" className="border-brand-yellow/40 bg-brand-yellow/10">
          <CardContent className="flex h-full flex-col justify-between gap-6 p-6">
            <div>
              <div className="flex items-center justify-between"><h2 className="text-sm text-muted-foreground" id="participations-title">{presentation ? "Atividades agendadas de exemplo" : "Inscrições ativas"}</h2><CalendarDays aria-hidden="true" className="size-5 text-brand-black" /></div>
              <p className="mt-3 text-3xl font-semibold">{isLoading ? "…" : loadError ? "—" : activities.length}</p>
            </div>
            <Button nativeButton={false} render={<Link href={presentation ? "/oportunidades" : "/minhas-atividades"} />} variant="outline">{presentation ? "Explorar oportunidades" : "Ver minhas atividades"}<ArrowUpRight aria-hidden="true" /></Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card aria-labelledby="hours-categories-title" as="section" className="border-brand-yellow/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div><CardTitle id="hours-categories-title">Horas por eixo</CardTitle><p className="mt-1 text-sm text-muted-foreground">{presentation ? "Distribuição de exemplo por categoria." : "Horas homologadas em cada categoria."}</p></div>
            <Clock3 aria-hidden="true" className="size-5 text-brand-black" />
          </CardHeader>
          <CardContent><ul className="space-y-6">{hoursSummary.map((item) => (
            <li className="space-y-2" key={item.category}>
              <div className="flex items-center justify-between text-sm"><span className="flex items-center gap-2 font-medium"><span aria-hidden="true" className={`size-2.5 rounded-full ${activityCategoryStyles[item.category].indicator}`} />{item.category}</span><span className="text-muted-foreground">{item.completed}h homologadas</span></div>
            </li>
          ))}</ul></CardContent>
        </Card>
        {presentation ? <CompletedDemoActivities activities={presentation.completedActivities} /> : isDemoModeEnabled ? <DashboardCertificates userId={user.id} /> : (
          <Card aria-labelledby="dashboard-certificates-title" as="section">
            <CardHeader><CardTitle id="dashboard-certificates-title">Certificados lançados</CardTitle></CardHeader>
            <CardContent className="space-y-4"><p className="text-sm text-muted-foreground">O registro de certificados está disponível somente na demonstração. O serviço de homologação ainda não está integrado.</p><Button nativeButton={false} render={<Link href="/certificados" />} variant="outline">Ver certificados</Button></CardContent>
          </Card>
        )}
      </div>

      <div className="mt-5 space-y-5" id="minhas-atividades">
        {isLoading ? <p className="rounded-xl border p-5 text-sm text-muted-foreground" role="status">Carregando suas inscrições e agenda...</p> : loadError ? <section aria-label="Erro ao carregar agenda" className="space-y-4 rounded-xl border p-5"><p className="text-sm text-destructive" role="alert">{loadError}</p><Button onClick={catalog.retry} variant="outline">Tentar novamente</Button></section> : (
          <div className="grid items-start gap-5 xl:grid-cols-[0.7fr_1.3fr]">
            <Card aria-labelledby="upcoming-activities-title" as="section" className="border-brand-yellow/30">
              <CardHeader><CardTitle id="upcoming-activities-title">Próximas atividades</CardTitle><p className="text-sm text-muted-foreground">Os próximos encontros das suas inscrições.</p></CardHeader>
              <CardContent className="space-y-5">
                {nextSessions.length === 0 ? <p className="text-sm text-muted-foreground">Você não tem próximos encontros agendados.</p> : <ul className="space-y-4">{nextSessions.map((entry) => <li className="rounded-xl border p-4" key={`${entry.opportunity.id}-${entry.date}-${entry.startsAt}`}>
                  <span aria-hidden="true" className={`mb-2 block h-1 w-10 rounded-full ${activityCategoryStyles[entry.opportunity.category].indicator}`} />
                  <h3 className="font-medium">{entry.opportunity.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{entry.opportunity.organization}</p>
                  <p className="mt-2 text-sm"><time dateTime={`${entry.date}T${entry.startsAt}`}>{formatSessionDate(entry.date)} · {entry.startsAt} – {entry.endsAt}</time></p>
                </li>)}</ul>}
                <div className="flex flex-wrap gap-2">
                  {!presentation ? <Button nativeButton={false} render={<Link href="/minhas-atividades" />} variant="outline">Gerenciar inscrições</Button> : null}
                  <Button nativeButton={false} render={<Link href="/oportunidades" />} variant="outline">Encontrar oportunidades</Button>
                </div>
              </CardContent>
            </Card>
            <ActivityAgenda activities={activities} />
          </div>
        )}
      </div>
    </AppShell>
  );
}

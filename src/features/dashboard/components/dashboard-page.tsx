import Link from "next/link";
import { ArrowUpRight, CalendarDays, CheckCircle2, Clock3 } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { AuthUser } from "@/features/auth/schemas/session-schema";
import { activityCategoryStyles } from "@/lib/activity-categories";

import type { DashboardSummary } from "@/features/dashboard/services/dashboard-summary";
import { isDemoModeEnabled } from "@/lib/demo-mode";
import { DashboardCertificates } from "@/features/dashboard/components/dashboard-certificates";

export function DashboardPage({ user, summary }: { user: AuthUser; summary: DashboardSummary }) {
  const { hoursSummary, upcomingActivities } = summary;
  const totalCompleted = hoursSummary.reduce((total, item) => total + item.completed, 0);

  return (
    <AppShell
      active="dashboard"
      description="Acompanhe seu progresso e encontre os próximos passos da sua jornada."
      title="Meu painel"
      user={user}
    >
      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
        <Card className="overflow-hidden border-brand-black bg-brand-black text-white shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-medium text-white/70">Banco de horas</p>
                <p className="mt-2 text-5xl font-semibold tracking-tight">{totalCompleted}h</p>
                <p className="mt-2 text-sm text-white/70">
                  Horas homologadas no portal. Envios em análise não entram neste total.
                </p>
              </div>
              <div className="rounded-2xl border border-brand-yellow/30 bg-brand-yellow px-4 py-3 text-brand-black">
                <CheckCircle2 aria-hidden="true" className="size-7" />
                <p className="mt-3 text-sm font-medium">Você está no caminho certo!</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-brand-yellow/40 bg-brand-yellow/10">
          <CardContent className="flex h-full flex-col justify-between gap-6 p-6">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Inscrições</p>
                <CalendarDays aria-hidden="true" className="size-5 text-brand-black" />
              </div>
              <p className="mt-3 text-3xl font-semibold">{summary.registrations}</p>
            </div>
            <Button nativeButton={false} render={<Link href="/oportunidades" />} variant="outline">
              Encontrar oportunidade
              <ArrowUpRight aria-hidden="true" />
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-brand-yellow/30">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Horas por eixo</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Seu progresso em cada categoria.</p>
            </div>
            <Clock3 aria-hidden="true" className="size-5 text-brand-black" />
          </CardHeader>
          <CardContent className="space-y-6">
            {hoursSummary.map((item) => {
              return (
                <div className="space-y-2" key={item.category}>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`size-2.5 rounded-full ${activityCategoryStyles[item.category].indicator}`} />
                      <span className="font-medium">{item.category}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {item.completed}h homologadas
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="scroll-mt-24 border-brand-yellow/30" id="minhas-atividades">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Próximas atividades</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">O que vem pela frente.</p>
            </div>
            <CalendarDays aria-hidden="true" className="size-5 text-brand-black" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingActivities.length === 0 ? <p className="text-sm text-muted-foreground">Você ainda não se inscreveu em atividades.</p> : null}
              {upcomingActivities.map((activity, index) => (
                <div key={activity.id}>
                  {index > 0 ? <Separator className="mb-4" /> : null}
                  <div className="flex gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-yellow/20 text-brand-black ring-1 ring-brand-yellow/40">
                      <CalendarDays aria-hidden="true" className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-5">{activity.title}</p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {activity.organization}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-muted-foreground">{activity.dateLabel}</span>
                        <Badge variant={activity.status === "Inscrito" ? "secondary" : "outline"}>
                          {activity.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {isDemoModeEnabled ? <DashboardCertificates userId={user.id} /> : (
        <Card className="mt-5" id="certificados"><CardContent className="p-6">
          O envio de certificados está disponível somente na demonstração. O serviço de homologação ainda não está integrado.
        </CardContent></Card>
      )}
    </AppShell>
  );
}

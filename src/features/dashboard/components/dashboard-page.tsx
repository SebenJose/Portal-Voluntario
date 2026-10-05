import Link from "next/link";
import { ArrowUpRight, CalendarDays, CheckCircle2, Clock3, FileCheck2 } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { AuthUser } from "@/features/auth/schemas/session-schema";

import { hoursSummary, upcomingActivities } from "../data/dashboard";

const categoryColors: Record<(typeof hoursSummary)[number]["category"], string> = {
  Ensino: "bg-brand-yellow",
  Pesquisa: "bg-brand-black",
  Extensão: "bg-brand-yellow/55",
};

export function DashboardPage({ user }: { user: AuthUser }) {
  const totalCompleted = hoursSummary.reduce((total, item) => total + item.completed, 0);
  const totalLimit = hoursSummary.reduce((total, item) => total + item.limit, 0);

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
                  de {totalLimit}h possíveis nas atividades acompanhadas
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
                <p className="text-sm text-muted-foreground">Participações</p>
                <CalendarDays aria-hidden="true" className="size-5 text-brand-black" />
              </div>
              <p className="mt-3 text-3xl font-semibold">08</p>
            </div>
            <Button render={<Link href="/oportunidades" />} variant="outline">
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
              const percentage = Math.round((item.completed / item.limit) * 100);

              return (
                <div className="space-y-2" key={item.category}>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`size-2.5 rounded-full ${categoryColors[item.category]}`} />
                      <span className="font-medium">{item.category}</span>
                    </div>
                    <span className="text-muted-foreground">
                      {item.completed}h / {item.limit}h
                    </span>
                  </div>
                  <Progress value={percentage} />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-brand-yellow/30">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Próximas atividades</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">O que vem pela frente.</p>
            </div>
            <CalendarDays aria-hidden="true" className="size-5 text-brand-black" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingActivities.map((activity, index) => (
                <div key={activity.id}>
                  {index > 0 ? <Separator className="mb-4" /> : null}
                  <div className="flex gap-3">
                    <div className="mt-0.5 rounded-lg border border-brand-yellow/40 bg-brand-yellow/15 p-2 text-brand-black">
                      <CalendarDays aria-hidden="true" className="size-4" />
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

      <Card className="mt-5 border-brand-yellow/50 bg-brand-yellow/10">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-lg border border-brand-yellow/50 bg-brand-yellow/30 p-2 text-brand-black">
              <FileCheck2 aria-hidden="true" className="size-5" />
            </div>
            <div>
              <p className="font-medium">Você possui certificados externos?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Envie seus comprovantes para solicitar a homologação das horas.
              </p>
            </div>
          </div>
          <Button render={<Link href="#submeter-certificado" />} variant="outline">
            Submeter certificado
          </Button>
        </CardContent>
      </Card>
    </AppShell>
  );
}

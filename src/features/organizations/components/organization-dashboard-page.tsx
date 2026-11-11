"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, Award, ClipboardList, UserCheck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuthUser } from "@/features/auth/schemas/session-schema";
import { summarizeOrganization, type OrganizationSummary } from "@/features/organizations/lib/dashboard-summary";
import { getManagedActivities, OrganizationActivitiesError } from "@/features/organizations/services/organization-activities";

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; summary: OrganizationSummary };

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <Card className="border-brand-yellow/30">
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div><dt className="text-sm text-muted-foreground">{label}</dt><dd className="mt-1 text-3xl font-semibold">{value}</dd></div>
        <Icon aria-hidden="true" className="size-6 text-brand-black" />
      </CardContent>
    </Card>
  );
}

export function OrganizationDashboardPage({ user }: { user: AuthUser }) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      setState({ status: "ready", summary: summarizeOrganization(await getManagedActivities()) });
    } catch (cause: unknown) {
      if (cause instanceof OrganizationActivitiesError && cause.status === 401) {
        router.replace("/entrar?next=%2Fpainel");
        return;
      }
      setState({ status: "error", message: cause instanceof OrganizationActivitiesError ? cause.message : "Não foi possível carregar o painel da organização." });
    }
  }, [router]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  return (
    <AppShell active="dashboard" description={`Resumo das atividades de ${user.organization?.name ?? "sua organização"}.`} title="Painel da organização" user={user}>
      {state.status === "loading" ? <p className="rounded-xl border p-5 text-sm text-muted-foreground" role="status">Carregando atividades da organização...</p> : null}
      {state.status === "error" ? (
        <section aria-label="Erro ao carregar o painel" className="space-y-4 rounded-xl border p-5">
          <p className="text-sm text-destructive" role="alert">{state.message}</p>
          <Button onClick={() => { void load(); }} variant="outline">Tentar novamente</Button>
        </section>
      ) : null}
      {state.status === "ready" ? (
        <div className="space-y-5">
          <dl aria-label="Indicadores da organização" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat icon={ClipboardList} label="Atividades em andamento" value={state.summary.openActivities} />
            <Stat icon={Users} label="Participantes inscritos" value={state.summary.participants} />
            <Stat icon={UserCheck} label="Presenças a registrar" value={state.summary.pendingAttendance} />
            <Stat icon={Award} label="Certificados emitidos" value={state.summary.issuedCertificates} />
          </dl>
          <Card aria-labelledby="attention-title" as="section" className="border-brand-yellow/30">
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle id="attention-title">Atividades que pedem atenção</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Presenças pendentes ou certificados prontos para emissão.</p>
              </div>
              <Button nativeButton={false} render={<Link href="/organizacao" />} variant="outline">Gerenciar atividades<ArrowUpRight aria-hidden="true" /></Button>
            </CardHeader>
            <CardContent>
              {state.summary.activities === 0 ? (
                <p className="text-sm text-muted-foreground">Sua organização ainda não publicou atividades. Crie a primeira em Gestão de atividades.</p>
              ) : state.summary.attention.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma pendência no momento.</p>
              ) : (
                <ul className="space-y-3">
                  {state.summary.attention.map((item) => (
                    <li className="flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center" key={item.activity.id}>
                      <div>
                        <h3 className="font-medium">{item.activity.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.activity.dateLabel}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {item.pendingAttendance > 0 ? <Badge variant="outline">{item.pendingAttendance} presença(s) a registrar</Badge> : null}
                        {item.readyToDispatch ? <Badge className="bg-emerald-50 text-emerald-900" variant="outline">Pronta para emitir certificados</Badge> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </AppShell>
  );
}

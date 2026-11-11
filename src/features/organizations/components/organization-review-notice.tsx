import Link from "next/link";
import { Clock3, XCircle } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import type { AuthUser } from "@/features/auth/schemas/session-schema";

/** Exibida para organizações ainda não aprovadas (ou recusadas) no lugar das telas de gestão. */
export function OrganizationReviewNotice({ user, active }: { user: AuthUser; active: "dashboard" | "organization" }) {
  const rejected = user.organization?.status === "rejected";
  const Icon = rejected ? XCircle : Clock3;
  return (
    <AppShell active={active} description="Acompanhe a análise do cadastro da sua organização." title="Painel da organização" user={user}>
      <Card aria-labelledby="organization-review-title" as="section" className={rejected ? "border-destructive/30" : "border-brand-yellow/50 bg-brand-yellow/10"}>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
          <Icon aria-hidden="true" className={`size-8 shrink-0 ${rejected ? "text-destructive" : "text-brand-black"}`} />
          <div className="space-y-2" role="status">
            <h2 className="text-lg font-semibold" id="organization-review-title">{rejected ? "Cadastro recusado" : "Cadastro em análise"}</h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {rejected
                ? `A administração recusou o cadastro de ${user.organization?.name ?? "sua organização"}. Entre em contato com a coordenação do Portal Voluntário para revisar as informações.`
                : `Recebemos o cadastro de ${user.organization?.name ?? "sua organização"}. A gestão de atividades será liberada assim que a administração aprovar a organização.`}
            </p>
            <p className="text-sm text-muted-foreground">Enquanto isso, você pode atualizar os dados em <Link className="font-medium text-brand-black underline underline-offset-4" href="/conta">Minha conta</Link>.</p>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}

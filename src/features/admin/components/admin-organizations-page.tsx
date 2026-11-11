"use client";

import { useState } from "react";
import { Building2, Mail } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusFilter } from "@/features/admin/components/status-filter";
import { useAdminCollection } from "@/features/admin/hooks/use-admin-collection";
import { organizationStatusLabels, organizationStatusStyles } from "@/features/admin/lib/labels";
import type { ManagedOrganization, OrganizationDecision } from "@/features/admin/schemas/admin-schema";
import { AdminServiceError, decideOrganization, getOrganizations } from "@/features/admin/services/admin";
import type { AuthUser, OrganizationStatus } from "@/features/auth/schemas/session-schema";

type Filter = OrganizationStatus | "all";
const filterOptions: ReadonlyArray<{ value: Filter; label: string }> = [
  { value: "pending", label: "Pendentes" }, { value: "approved", label: "Aprovadas" }, { value: "rejected", label: "Recusadas" }, { value: "all", label: "Todas" },
];

function loadOrganizations(filter: Filter, signal: AbortSignal): Promise<ManagedOrganization[]> {
  return getOrganizations(filter === "all" ? undefined : filter, signal);
}

function OrganizationCard({ organization, onDecided }: { organization: ManagedOrganization; onDecided: (organization: ManagedOrganization, message: string) => void }) {
  const [pending, setPending] = useState<OrganizationDecision | null>(null);
  const [confirmingReject, setConfirmingReject] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(status: OrganizationDecision): Promise<void> {
    setPending(status);
    setError(null);
    try {
      const updated = await decideOrganization(organization.id, status);
      onDecided(updated, status === "approved" ? `${updated.name} foi aprovada e já pode gerenciar atividades.` : `${updated.name} foi recusada.`);
    } catch (cause: unknown) {
      setError(cause instanceof AdminServiceError ? cause.message : "Não foi possível registrar a decisão.");
    } finally {
      setPending(null);
      setConfirmingReject(false);
    }
  }

  const titleId = `organization-${organization.id}-title`;
  return (
    <Card aria-labelledby={titleId} as="article" className="h-full">
      <CardHeader>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <Building2 aria-hidden="true" className="size-5 text-brand-black" />
          <Badge className={organizationStatusStyles[organization.status]} variant="outline">{organizationStatusLabels[organization.status]}</Badge>
        </div>
        <CardTitle as="h3" className="break-words text-lg" id={titleId}>{organization.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
        <p>Responsável: <span className="font-medium text-brand-black">{organization.owner.name}</span></p>
        <p className="flex items-center gap-2 break-all"><Mail aria-hidden="true" className="size-4 shrink-0" />{organization.owner.email}</p>
        <p>{organization.activities} atividade(s) publicada(s)</p>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-3">
        <div className="flex flex-wrap gap-2">
          {organization.status !== "approved" ? (
            <Button aria-busy={pending === "approved"} disabled={pending !== null} onClick={() => { void decide("approved"); }}>
              {pending === "approved" ? "Aprovando..." : `Aprovar ${organization.name}`}
            </Button>
          ) : null}
          {organization.status !== "rejected" && !confirmingReject ? (
            <Button disabled={pending !== null} onClick={() => setConfirmingReject(true)} variant="outline">Recusar</Button>
          ) : null}
        </div>
        {confirmingReject ? (
          <div className="w-full space-y-3 rounded-lg border p-3">
            <p className="text-sm" role="alert">
              {organization.status === "approved" ? "A organização perderá o acesso à gestão de atividades. Confirmar recusa?" : "Confirmar a recusa deste cadastro?"}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button aria-busy={pending === "rejected"} disabled={pending !== null} onClick={() => { void decide("rejected"); }} variant="destructive">
                {pending === "rejected" ? "Recusando..." : `Confirmar recusa de ${organization.name}`}
              </Button>
              <Button disabled={pending !== null} onClick={() => setConfirmingReject(false)} variant="outline">Cancelar</Button>
            </div>
          </div>
        ) : null}
        {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
      </CardFooter>
    </Card>
  );
}

export function AdminOrganizationsPage({ user }: { user: AuthUser }) {
  const [filter, setFilter] = useState<Filter>("pending");
  const [notice, setNotice] = useState<string | null>(null);
  const collection = useAdminCollection(loadOrganizations, filter, "/administracao");

  return (
    <AppShell active="admin-organizations" description="Aprove as organizações antes que elas publiquem e gerenciem atividades." title="Organizações" user={user}>
      <section aria-labelledby="organizations-list-title" className="space-y-5">
        <h2 className="sr-only" id="organizations-list-title">Cadastros de organizações</h2>
        <StatusFilter label="Filtrar organizações por status" onChange={(value) => { setFilter(value); setNotice(null); }} options={filterOptions} value={filter} />
        {notice ? <p className="rounded-lg border border-emerald-800/20 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">{notice}</p> : null}
        {collection.isLoading ? <p className="rounded-xl border p-5 text-sm text-muted-foreground" role="status">Carregando organizações...</p>
          : collection.error ? (
            <div className="space-y-3 rounded-xl border p-5"><p className="text-sm text-destructive" role="alert">{collection.error}</p><Button onClick={collection.retry} variant="outline">Tentar novamente</Button></div>
          ) : collection.items.length === 0 ? (
            <p className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">Nenhuma organização neste filtro.</p>
          ) : (
            <ul className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
              {collection.items.map((organization) => (
                <li key={organization.id}>
                  <OrganizationCard
                    onDecided={(updated, message) => { collection.replace(updated, filter === "all" || filter === updated.status); setNotice(message); }}
                    organization={organization}
                  />
                </li>
              ))}
            </ul>
          )}
      </section>
    </AppShell>
  );
}

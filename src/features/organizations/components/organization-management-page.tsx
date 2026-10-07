"use client";

import { CheckCheck, Mail, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { OrganizationDataSkeleton } from "@/components/layout/route-loading-skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { AuthUser } from "@/features/auth/schemas/session-schema";

import {
  dispatchActivityCertificates,
  getManagedActivities,
  OrganizationActivitiesError,
  updateParticipantAttendance,
  type ActivityParticipant,
  type AttendanceStatus,
  type ManagedActivity,
} from "../services/organization-activities";

const statusStyles: Record<AttendanceStatus, string> = {
  Inscrito: "border-brand-black/20 bg-brand-black/5 text-brand-black",
  Presente: "border-emerald-800/25 bg-emerald-50 text-emerald-900",
  Ausente: "border-red-800/20 bg-red-50 text-red-900",
};

export function OrganizationManagementPage({ user }: { user: AuthUser }) {
  const [activities, setActivities] = useState<Array<ManagedActivity>>([]);
  const [activeActivityId, setActiveActivityId] = useState("");
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<"Todos" | AttendanceStatus>("Todos");

  const loadActivities = useCallback(async () => {
    try {
      const result = await getManagedActivities();
      setActivities(result);
      setActiveActivityId((currentId) => currentId || result[0]?.id || "");
      setError(null);
    } catch (cause: unknown) {
      setError(
        cause instanceof OrganizationActivitiesError
          ? cause.message
          : "Ocorreu um erro inesperado ao carregar as atividades.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadActivities);
  }, [loadActivities]);

  const activeActivity = activities.find((activity) => activity.id === activeActivityId);
  const visibleParticipants = useMemo(() => {
    if (!activeActivity) {
      return [];
    }

    const normalizedSearch = search.trim().toLocaleLowerCase();

    return activeActivity.participants.filter((participant) => {
      const matchesStatus = selectedStatus === "Todos" || participant.status === selectedStatus;
      const matchesSearch = `${participant.name} ${participant.email}`
        .toLocaleLowerCase()
        .includes(normalizedSearch);
      return matchesStatus && matchesSearch;
    });
  }, [activeActivity, search, selectedStatus]);

  const presentCount = activeActivity?.participants.filter(({ status }) => status === "Presente").length ?? 0;
  const selectedVisibleIds = visibleParticipants
    .filter((participant) => selectedIds.has(participant.id))
    .map((participant) => participant.id);
  const allVisibleSelected = visibleParticipants.length > 0 && selectedVisibleIds.length === visibleParticipants.length;

  function toggleParticipant(participantId: string) {
    setSelectedIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (nextIds.has(participantId)) {
        nextIds.delete(participantId);
      } else {
        nextIds.add(participantId);
      }
      return nextIds;
    });
  }

  function toggleVisibleParticipants() {
    setSelectedIds((currentIds) => {
      const nextIds = new Set(currentIds);
      if (allVisibleSelected) {
        visibleParticipants.forEach(({ id }) => nextIds.delete(id));
      } else {
        visibleParticipants.forEach(({ id }) => nextIds.add(id));
      }
      return nextIds;
    });
  }

  async function applyAttendance(participants: Array<ActivityParticipant>, status: AttendanceStatus) {
    if (!activeActivity || participants.length === 0) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const updatedParticipants = await Promise.all(
        participants.map((participant) =>
          updateParticipantAttendance(activeActivity.id, participant.id, status),
        ),
      );
      const updatedIds = new Set(updatedParticipants.map(({ id }) => id));
      setActivities((currentActivities) =>
        currentActivities.map((activity) =>
          activity.id === activeActivity.id
            ? {
                ...activity,
                participants: activity.participants.map((participant) =>
                  updatedIds.has(participant.id)
                    ? { ...participant, status }
                    : participant,
                ),
              }
            : activity,
        ),
      );
      setSelectedIds((currentIds) => {
        const nextIds = new Set(currentIds);
        updatedIds.forEach((id) => nextIds.delete(id));
        return nextIds;
      });
      setNotice(
        participants.length === 1
          ? `Presença de ${participants[0]?.name ?? "participante"} atualizada para ${status.toLocaleLowerCase()}.`
          : `Presença atualizada para ${participants.length} participantes.`,
      );
    } catch (cause: unknown) {
      setError(
        cause instanceof OrganizationActivitiesError
          ? cause.message
          : "Não foi possível salvar todas as presenças. Atualize os dados e tente novamente.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDispatchCertificates() {
    if (!activeActivity || presentCount === 0) {
      return;
    }

    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const receipt = await dispatchActivityCertificates(activeActivity.id);
      setActivities((currentActivities) =>
        currentActivities.map((activity) =>
          activity.id === receipt.activityId
            ? { ...activity, certificatesDispatched: true }
            : activity,
        ),
      );
      setNotice(`Despacho simulado: ${receipt.sentCount} certificado(s) enviados por e-mail.`);
    } catch (cause: unknown) {
      setError(
        cause instanceof OrganizationActivitiesError
          ? cause.message
          : "Não foi possível enviar os certificados.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell
      active="organization"
      description="Confirme a frequência e prepare os certificados de quem participou."
      title="Gestão de atividades"
      user={user}
    >
      {isLoading ? (
        <OrganizationDataSkeleton />
      ) : error && activities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-destructive/40 bg-white p-12 text-center" role="alert">
          <p className="font-semibold">Não foi possível carregar a gestão de atividades</p>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button className="mt-5" onClick={() => {
            setIsLoading(true);
            void loadActivities();
          }} variant="outline">
            Tentar novamente
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <Card className="border-brand-yellow/40">
            <CardHeader>
              <CardTitle>Atividade</CardTitle>
              <CardDescription>Selecione o evento para acompanhar participantes e certificados.</CardDescription>
            </CardHeader>
            <CardContent>
              <Label className="sr-only" htmlFor="managed-activity">Atividade para gerenciar</Label>
              <select
                className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
                id="managed-activity"
                onChange={(event) => {
                  setActiveActivityId(event.target.value);
                  setSelectedIds(new Set());
                  setNotice(null);
                }}
                value={activeActivityId}
              >
                {activities.map((activity) => (
                  <option key={activity.id} value={activity.id}>{activity.title}</option>
                ))}
              </select>
            </CardContent>
          </Card>

          {activeActivity ? (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <Card><CardContent className="flex items-center gap-3 p-5"><Users aria-hidden="true" className="size-5 text-brand-black" /><div><p className="text-sm text-muted-foreground">Inscritos</p><p className="text-2xl font-semibold">{activeActivity.participants.length}</p></div></CardContent></Card>
                <Card><CardContent className="flex items-center gap-3 p-5"><CheckCheck aria-hidden="true" className="size-5 text-emerald-800" /><div><p className="text-sm text-muted-foreground">Presenças confirmadas</p><p className="text-2xl font-semibold">{presentCount}</p></div></CardContent></Card>
                <Card><CardContent className="flex items-center gap-3 p-5"><Mail aria-hidden="true" className="size-5 text-brand-black" /><div><p className="text-sm text-muted-foreground">Certificados</p><p className="text-base font-semibold">{activeActivity.certificatesDispatched ? "Despachados" : "Aguardando envio"}</p></div></CardContent></Card>
              </div>

              <Card className="border-brand-yellow/30">
                <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <CardTitle>Participantes</CardTitle>
                    <CardDescription className="mt-1">{activeActivity.dateLabel} · {visibleParticipants.length} exibidos</CardDescription>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      aria-label="Buscar participante"
                      className="rounded-lg border border-input bg-white px-3 py-2 text-sm"
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Buscar nome ou e-mail"
                      value={search}
                    />
                    <Label className="sr-only" htmlFor="attendance-filter">Filtrar por presença</Label>
                    <select
                      className="rounded-lg border border-input bg-white px-3 py-2 text-sm"
                      id="attendance-filter"
                      onChange={(event) => {
                        const value = event.target.value;
                        if (value === "Todos" || value === "Inscrito" || value === "Presente" || value === "Ausente") {
                          setSelectedStatus(value);
                        }
                      }}
                      value={selectedStatus}
                    >
                      <option value="Todos">Todos os status</option>
                      <option value="Inscrito">Inscritos</option>
                      <option value="Presente">Presentes</option>
                      <option value="Ausente">Ausentes</option>
                    </select>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-3 rounded-xl bg-muted/70 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap gap-2">
                      <Button disabled={isSaving || selectedVisibleIds.length === 0} onClick={() => void applyAttendance(visibleParticipants.filter(({ id }) => selectedIds.has(id)), "Presente")} size="sm">
                        Marcar selecionados presentes
                      </Button>
                      <Button disabled={isSaving || selectedVisibleIds.length === 0} onClick={() => void applyAttendance(visibleParticipants.filter(({ id }) => selectedIds.has(id)), "Ausente")} size="sm" variant="outline">
                        Marcar selecionados ausentes
                      </Button>
                    </div>
                    <Button
                      disabled={isSaving || presentCount === 0 || activeActivity.certificatesDispatched}
                      onClick={() => void handleDispatchCertificates()}
                      size="sm"
                      variant="outline"
                    >
                      <Mail aria-hidden="true" />
                      {activeActivity.certificatesDispatched ? "Certificados despachados" : "Enviar certificados dos presentes"}
                    </Button>
                  </div>

                  {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
                  {notice ? <p className="text-sm text-emerald-800" role="status">{notice}</p> : null}

                  {visibleParticipants.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[680px] text-left text-sm">
                        <thead className="border-b text-xs uppercase text-muted-foreground">
                          <tr>
                            <th className="w-10 px-3 py-3">
                              <input
                                aria-label="Selecionar todos os participantes visíveis"
                                checked={allVisibleSelected}
                                onChange={toggleVisibleParticipants}
                                type="checkbox"
                              />
                            </th>
                            <th className="px-3 py-3">Participante</th>
                            <th className="px-3 py-3">Inscrição</th>
                            <th className="px-3 py-3">Presença</th>
                            <th className="px-3 py-3">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {visibleParticipants.map((participant) => (
                            <tr key={participant.id}>
                              <td className="px-3 py-4">
                                <input
                                  aria-label={`Selecionar ${participant.name}`}
                                  checked={selectedIds.has(participant.id)}
                                  onChange={() => toggleParticipant(participant.id)}
                                  type="checkbox"
                                />
                              </td>
                              <td className="px-3 py-4">
                                <p className="font-medium">{participant.name}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{participant.email}</p>
                              </td>
                              <td className="px-3 py-4 text-muted-foreground">{participant.registeredAt}</td>
                              <td className="px-3 py-4"><Badge className={statusStyles[participant.status]} variant="outline">{participant.status}</Badge></td>
                              <td className="px-3 py-4">
                                <div className="flex gap-2">
                                  <Button disabled={isSaving || participant.status === "Presente"} onClick={() => void applyAttendance([participant], "Presente")} size="sm" variant="outline">Presente</Button>
                                  <Button disabled={isSaving || participant.status === "Ausente"} onClick={() => void applyAttendance([participant], "Ausente")} size="sm" variant="outline">Ausente</Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed p-8 text-center">
                      <p className="font-medium">Nenhum participante encontrado</p>
                      <p className="mt-1 text-sm text-muted-foreground">Altere os filtros para ver outras inscrições.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhuma atividade disponível para gestão.</CardContent></Card>
          )}
        </div>
      )}
    </AppShell>
  );
}

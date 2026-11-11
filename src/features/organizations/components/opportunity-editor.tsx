"use client";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { opportunityFormSchema, type OpportunityFormInput, type OpportunityFormValues } from "@/features/organizations/schemas/opportunity-form-schema";
import { deleteOpportunity, getEditableOpportunity, saveOpportunity } from "@/features/organizations/services/manage-opportunities";
import { activityCategories } from "@/lib/activity-categories";

const textFields: Array<{ name: "id" | "title" | "location" | "dateLabel" | "durationLabel" | "hours" | "vacancies"; label: string }> = [
  { name: "id", label: "Identificador" }, { name: "title", label: "Título" }, { name: "location", label: "Local" },
  { name: "dateLabel", label: "Período para exibição" }, { name: "durationLabel", label: "Horários para exibição" },
  { name: "hours", label: "Carga horária" }, { name: "vacancies", label: "Vagas" },
];

export function OpportunityEditor({ activityId, onSaved }: { activityId?: string; onSaved: () => Promise<void> }) {
  const [loading, setLoading] = useState(Boolean(activityId));
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const form = useForm<OpportunityFormInput, unknown, OpportunityFormValues>({ resolver: zodResolver(opportunityFormSchema),
    defaultValues: { id: "", title: "", description: "", category: "Extensão", format: "Presencial", location: "", dateLabel: "", durationLabel: "", hours: "1", vacancies: "1", featured: false, sessions: [{ date: "", startsAt: "08:00", endsAt: "12:00" }] } });
  const sessions = useFieldArray({ control: form.control, name: "sessions" });
  const reset = form.reset;
  useEffect(() => {
    if (!activityId) return;
    let active = true;
    void getEditableOpportunity(activityId).then((item) => { if (active) reset(item); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Não foi possível carregar a atividade."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [activityId, reset, loadAttempt]);
  const busy = form.formState.isSubmitting || deleting;
  const prefix = activityId ?? "nova";

  async function save(values: OpportunityFormValues): Promise<void> {
    setError(null); setNotice(null);
    try {
      await saveOpportunity(values, Boolean(activityId));
      if (!activityId) form.reset();
      setNotice("Atividade salva.");
      await onSaved();
    } catch (cause: unknown) { setError(cause instanceof Error ? cause.message : "Não foi possível salvar a atividade."); }
  }

  async function remove(): Promise<void> {
    if (!activityId) return;
    setDeleting(true); setError(null);
    try { await deleteOpportunity(activityId); await onSaved(); }
    catch (cause: unknown) { setError(cause instanceof Error ? cause.message : "Não foi possível excluir a atividade."); }
    finally { setDeleting(false); }
  }

  return <details className="rounded-xl border bg-white p-5">
    <summary className="cursor-pointer font-medium">{activityId ? "Editar atividade selecionada" : "Criar atividade"}</summary>
    {loading ? <p className="mt-4" role="status">Carregando atividade...</p> : <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(save)} noValidate aria-busy={busy}>
      <fieldset disabled={!form.formState.isReady || busy || Boolean(activityId && error && !form.getValues("id"))} className="contents">
        {textFields.map(({ name, label }) => <div className="space-y-2" key={name}>
          <Label htmlFor={`${prefix}-${name}`}>{label}</Label>
          <Input id={`${prefix}-${name}`} readOnly={name === "id" && Boolean(activityId)} {...form.register(name)}
            aria-invalid={Boolean(form.formState.errors[name])} aria-describedby={form.formState.errors[name] ? `${prefix}-${name}-error` : undefined} />
          {form.formState.errors[name] ? <p role="alert" className="text-sm text-destructive" id={`${prefix}-${name}-error`}>{form.formState.errors[name]?.message}</p> : null}
        </div>)}
        <div className="space-y-2"><Label htmlFor={`${prefix}-category`}>Eixo</Label><select id={`${prefix}-category`} className="w-full rounded-md border p-2" {...form.register("category")}>{activityCategories.map((category) => <option key={category}>{category}</option>)}</select></div>
        <div className="space-y-2"><Label htmlFor={`${prefix}-format`}>Formato</Label><select id={`${prefix}-format`} className="w-full rounded-md border p-2" {...form.register("format")}><option>Presencial</option><option>Híbrido</option><option>Online</option></select></div>
        <div className="space-y-2 sm:col-span-2"><Label htmlFor={`${prefix}-description`}>Descrição</Label><textarea className="w-full rounded-md border p-2" id={`${prefix}-description`} {...form.register("description")} aria-invalid={Boolean(form.formState.errors.description)} aria-describedby={`${prefix}-description-error`} /><p className="text-sm text-destructive" id={`${prefix}-description-error`}>{form.formState.errors.description?.message}</p></div>
        <label className="flex items-center gap-2"><input type="checkbox" {...form.register("featured")} />Destacar no catálogo</label>
        <fieldset className="space-y-4 sm:col-span-2"><legend className="mb-3 font-medium">Encontros</legend>
          {sessions.fields.map((session, index) => <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-3" key={session.id}>
            <div><Label htmlFor={`${prefix}-date-${index}`}>Data {index + 1}</Label><Input id={`${prefix}-date-${index}`} type="date" {...form.register(`sessions.${index}.date`)} aria-invalid={Boolean(form.formState.errors.sessions?.[index]?.date)} aria-describedby={`${prefix}-session-error-${index}`} /></div>
            <div><Label htmlFor={`${prefix}-start-${index}`}>Início</Label><Input id={`${prefix}-start-${index}`} type="time" {...form.register(`sessions.${index}.startsAt`)} aria-invalid={Boolean(form.formState.errors.sessions?.[index]?.startsAt)} aria-describedby={`${prefix}-session-error-${index}`} /></div>
            <div><Label htmlFor={`${prefix}-end-${index}`}>Término</Label><Input id={`${prefix}-end-${index}`} type="time" {...form.register(`sessions.${index}.endsAt`)} aria-invalid={Boolean(form.formState.errors.sessions?.[index]?.endsAt ?? form.formState.errors.sessions?.[index]?.message)} aria-describedby={`${prefix}-session-error-${index}`} /></div>
            <p className="text-sm text-destructive sm:col-span-3" id={`${prefix}-session-error-${index}`} role="alert">{form.formState.errors.sessions?.[index]?.date?.message ?? form.formState.errors.sessions?.[index]?.startsAt?.message ?? form.formState.errors.sessions?.[index]?.endsAt?.message ?? form.formState.errors.sessions?.[index]?.message}</p>
            <Button type="button" variant="outline" disabled={sessions.fields.length < 2} onClick={() => sessions.remove(index)}>Remover encontro {index + 1}</Button>
          </div>)}
          <Button type="button" variant="outline" onClick={() => sessions.append({ date: "", startsAt: "08:00", endsAt: "12:00" })}>Adicionar encontro</Button>
        </fieldset>
        <Button type="submit">{form.formState.isSubmitting ? "Salvando..." : "Salvar atividade"}</Button>
      </fieldset>
    </form>}
    {error ? <div className="mt-4 space-y-3"><p role="alert" className="text-sm text-destructive">{error}</p>{activityId && !form.getValues("id") ? <Button variant="outline" onClick={() => { setLoading(true); setError(null); setLoadAttempt((value) => value + 1); }}>Tentar novamente</Button> : null}</div> : null}
    {notice ? <p className="mt-4 text-sm" role="status">{notice}</p> : null}
    {activityId && !loading ? <div className="mt-5 space-y-3 border-t pt-4">
      {confirmDelete ? <><p role="alert">Excluir esta atividade? Atividades com inscrições não podem ser excluídas.</p><div className="flex gap-3"><Button variant="destructive" disabled={busy} onClick={() => { void remove(); }}>Confirmar exclusão da atividade</Button><Button variant="outline" disabled={busy} onClick={() => setConfirmDelete(false)}>Cancelar</Button></div></> : <Button variant="outline" disabled={busy} onClick={() => setConfirmDelete(true)}>Excluir atividade</Button>}
    </div> : null}
  </details>;
}

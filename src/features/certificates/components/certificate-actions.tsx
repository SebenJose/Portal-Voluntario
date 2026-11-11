"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { activityCategories } from "@/lib/activity-categories";
import { certificateFieldsInputSchema, type CertificateRecord } from "@/features/certificates/schemas/certificate-schema";
import { deleteCertificate, updateCertificate } from "@/features/certificates/services/certificates";

export function CertificateActions({ certificate, onChanged }: { certificate: CertificateRecord; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<z.input<typeof certificateFieldsInputSchema>, unknown, z.infer<typeof certificateFieldsInputSchema>>({
    resolver: zodResolver(certificateFieldsInputSchema),
    defaultValues: { title: certificate.title, category: certificate.category, hours: String(certificate.hours), description: certificate.description },
  });
  const busy = deleting || form.formState.isSubmitting;
  const prefix = `edit-${certificate.id}`;

  async function save(values: z.infer<typeof certificateFieldsInputSchema>): Promise<void> {
    setError(null);
    try { await updateCertificate(certificate.id, values); setEditing(false); onChanged(); }
    catch (cause: unknown) { setError(cause instanceof Error ? cause.message : "Não foi possível atualizar o registro."); }
  }

  async function remove(): Promise<void> {
    setDeleting(true); setError(null);
    try { await deleteCertificate(certificate.id); onChanged(); }
    catch (cause: unknown) { setError(cause instanceof Error ? cause.message : "Não foi possível excluir o registro."); }
    finally { setDeleting(false); }
  }

  return <div className="w-full space-y-4">
    <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy} aria-expanded={editing} onClick={() => { setEditing((value) => !value); setConfirming(false); }}>Editar registro</Button><Button variant="outline" disabled={busy} onClick={() => { setConfirming(true); setEditing(false); }}>Excluir registro</Button></div>
    {editing ? <form className="space-y-4 rounded-lg border p-4" aria-label={`Editar ${certificate.title}`} noValidate onSubmit={form.handleSubmit(save)} aria-busy={busy}>
      <fieldset disabled={busy} className="space-y-4">
        <div><Label htmlFor={`${prefix}-title`}>Título da atividade</Label><Input id={`${prefix}-title`} {...form.register("title")} aria-invalid={Boolean(form.formState.errors.title)} aria-describedby={`${prefix}-title-error`} /><p id={`${prefix}-title-error`} className="text-sm text-destructive">{form.formState.errors.title?.message}</p></div>
        <div><Label htmlFor={`${prefix}-category`}>Eixo temático</Label><select id={`${prefix}-category`} className="w-full rounded-md border p-2" {...form.register("category")}>{activityCategories.map((category) => <option key={category}>{category}</option>)}</select></div>
        <div><Label htmlFor={`${prefix}-hours`}>Horas declaradas</Label><Input id={`${prefix}-hours`} inputMode="numeric" {...form.register("hours")} aria-invalid={Boolean(form.formState.errors.hours)} aria-describedby={`${prefix}-hours-error`} /><p id={`${prefix}-hours-error`} className="text-sm text-destructive">{form.formState.errors.hours?.message}</p></div>
        <div><Label htmlFor={`${prefix}-description`}>Descrição</Label><textarea id={`${prefix}-description`} className="w-full rounded-md border p-2" {...form.register("description")} aria-invalid={Boolean(form.formState.errors.description)} aria-describedby={`${prefix}-description-error`} /><p id={`${prefix}-description-error`} className="text-sm text-destructive">{form.formState.errors.description?.message}</p></div>
        <Button type="submit">{form.formState.isSubmitting ? "Salvando..." : "Salvar registro"}</Button>
      </fieldset>
    </form> : null}
    {confirming ? <div className="space-y-3 rounded-lg border p-4"><p role="alert">Excluir “{certificate.title}” e seu comprovante?</p><div className="flex flex-wrap gap-2"><Button variant="destructive" disabled={busy} onClick={() => { void remove(); }}>{deleting ? "Excluindo..." : "Confirmar exclusão do registro"}</Button><Button variant="outline" disabled={busy} onClick={() => setConfirming(false)}>Cancelar</Button></div></div> : null}
    {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
  </div>;
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { submissionReviewSchema, type ReviewSubmission, type SubmissionReviewValues } from "@/features/admin/schemas/admin-schema";
import { AdminServiceError, reviewSubmission } from "@/features/admin/services/admin";

type ReviewFormInput = { status: SubmissionReviewValues["status"]; note: string };

export function SubmissionReviewForm({ submission, onReviewed }: { submission: ReviewSubmission; onReviewed: (submission: ReviewSubmission) => void }) {
  const form = useForm<ReviewFormInput, unknown, SubmissionReviewValues>({
    resolver: zodResolver(submissionReviewSchema),
    defaultValues: { status: "Aprovado", note: "" },
  });
  const prefix = `review-${submission.id}`;
  const status = useWatch({ control: form.control, name: "status" });
  const busy = form.formState.isSubmitting;

  async function submit(values: SubmissionReviewValues): Promise<void> {
    form.clearErrors("root.server");
    try {
      onReviewed(await reviewSubmission(submission.id, values));
    } catch (cause: unknown) {
      form.setError("root.server", { type: "server", message: cause instanceof AdminServiceError ? cause.message : "Não foi possível registrar a avaliação." });
    }
  }

  return (
    <form aria-busy={busy} aria-label={`Avaliar ${submission.title}`} className="w-full space-y-3 rounded-lg border p-4" noValidate onSubmit={form.handleSubmit(submit)}>
      <fieldset className="space-y-3" disabled={busy}>
        <legend className="text-sm font-medium">Decisão</legend>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="radio" value="Aprovado" {...form.register("status")} />Aprovar e somar {submission.hours}h</label>
          <label className="flex items-center gap-2"><input type="radio" value="Recusado" {...form.register("status")} />Recusar</label>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${prefix}-note`}>{status === "Recusado" ? "Motivo da recusa" : "Observação (opcional)"}</Label>
          <textarea
            aria-describedby={form.formState.errors.note ? `${prefix}-note-error` : undefined}
            aria-invalid={Boolean(form.formState.errors.note)}
            className="min-h-20 w-full rounded-md border p-2 text-sm"
            id={`${prefix}-note`}
            {...form.register("note")}
          />
          {form.formState.errors.note ? <p className="text-sm text-destructive" id={`${prefix}-note-error`}>{form.formState.errors.note.message}</p> : null}
        </div>
        <Button aria-busy={busy} type="submit" variant={status === "Recusado" ? "destructive" : "default"}>
          {busy ? "Registrando..." : status === "Recusado" ? "Recusar certificado" : "Aprovar certificado"}
        </Button>
      </fieldset>
      {form.formState.errors.root?.server ? <p className="text-sm text-destructive" role="alert">{form.formState.errors.root.server.message}</p> : null}
    </form>
  );
}

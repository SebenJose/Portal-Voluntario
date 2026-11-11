"use client";

import { useState } from "react";
import { CalendarDays, Clock3, Download, FileText, UserRound } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusFilter } from "@/features/admin/components/status-filter";
import { SubmissionReviewForm } from "@/features/admin/components/submission-review-form";
import { useAdminCollection } from "@/features/admin/hooks/use-admin-collection";
import { certificateStatusStyles } from "@/features/certificates/lib/status";
import type { ReviewSubmission } from "@/features/admin/schemas/admin-schema";
import { downloadReviewDocument, getReviewSubmissions } from "@/features/admin/services/admin";
import type { AuthUser } from "@/features/auth/schemas/session-schema";
import { formatCertificateDate, formatCertificateSize } from "@/features/certificates/lib/formatting";
import type { CertificateStatus } from "@/features/certificates/schemas/certificate-schema";
import { activityCategoryStyles } from "@/lib/activity-categories";

type Filter = CertificateStatus | "Todos";
const filterOptions: ReadonlyArray<{ value: Filter; label: string }> = [
  { value: "Em análise", label: "Em análise" }, { value: "Aprovado", label: "Aprovados" }, { value: "Recusado", label: "Recusados" }, { value: "Todos", label: "Todos" },
];

function loadSubmissions(filter: Filter, signal: AbortSignal): Promise<ReviewSubmission[]> {
  return getReviewSubmissions(filter === "Todos" ? undefined : filter, signal);
}

function SubmissionCard({ submission, onReviewed }: { submission: ReviewSubmission; onReviewed: (submission: ReviewSubmission) => void }) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleId = `submission-${submission.id}-title`;

  async function download(): Promise<void> {
    setDownloading(true);
    setError(null);
    try { await downloadReviewDocument(submission); }
    catch (cause: unknown) { setError(cause instanceof Error ? cause.message : "Não foi possível baixar o comprovante."); }
    finally { setDownloading(false); }
  }

  return (
    <Card aria-labelledby={titleId} as="article" className="h-full">
      <CardHeader>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <Badge className={activityCategoryStyles[submission.category].badge} variant="outline">{submission.category}</Badge>
          <Badge className={certificateStatusStyles[submission.status]} variant="outline">{submission.status}</Badge>
        </div>
        <CardTitle as="h3" className="break-words text-lg leading-6" id={titleId}>{submission.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 text-sm">
        <p className="break-words leading-6 text-muted-foreground">{submission.description}</p>
        <dl className="space-y-2 text-muted-foreground">
          <div><dt className="sr-only">Voluntário</dt><dd className="flex items-center gap-2"><UserRound aria-hidden="true" className="size-4 shrink-0" /><span className="break-all">{submission.volunteer.name} · {submission.volunteer.email}</span></dd></div>
          <div><dt className="sr-only">Horas declaradas</dt><dd className="flex items-center gap-2"><Clock3 aria-hidden="true" className="size-4 shrink-0" />{submission.hours}h declaradas</dd></div>
          <div><dt className="sr-only">Enviado em</dt><dd className="flex items-center gap-2"><CalendarDays aria-hidden="true" className="size-4 shrink-0" />Enviado em <time dateTime={submission.createdAt}>{formatCertificateDate(submission.createdAt)}</time></dd></div>
          <div><dt className="sr-only">Comprovante</dt><dd className="flex items-center gap-2"><FileText aria-hidden="true" className="size-4 shrink-0" /><span className="break-all">{submission.document.name} · {formatCertificateSize(submission.document.size)}</span></dd></div>
        </dl>
        {submission.review ? (
          <p className="rounded-lg border px-3 py-2">
            Avaliado em <time dateTime={submission.review.reviewedAt}>{formatCertificateDate(submission.review.reviewedAt)}</time>
            {submission.review.note ? <>: {submission.review.note}</> : "."}
          </p>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        <Button aria-busy={downloading} aria-label={`Baixar comprovante de ${submission.title}`} disabled={downloading} onClick={() => { void download(); }} variant="outline">
          <Download aria-hidden="true" />{downloading ? "Baixando..." : "Baixar comprovante"}
        </Button>
        {error ? <p className="text-sm text-destructive" role="alert">{error}</p> : null}
        {submission.status === "Em análise" ? <SubmissionReviewForm onReviewed={onReviewed} submission={submission} /> : null}
      </CardFooter>
    </Card>
  );
}

export function AdminCertificatesPage({ user }: { user: AuthUser }) {
  const [filter, setFilter] = useState<Filter>("Em análise");
  const [notice, setNotice] = useState<string | null>(null);
  const collection = useAdminCollection(loadSubmissions, filter, "/administracao/certificados");

  return (
    <AppShell active="admin-certificates" description="Avalie os certificados externos enviados pelos voluntários. Aprovados somam horas homologadas." title="Certificados externos" user={user}>
      <section aria-labelledby="submissions-list-title" className="space-y-5">
        <h2 className="sr-only" id="submissions-list-title">Certificados para avaliação</h2>
        <StatusFilter label="Filtrar certificados por status" onChange={(value) => { setFilter(value); setNotice(null); }} options={filterOptions} value={filter} />
        {notice ? <p className="rounded-lg border border-emerald-800/20 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">{notice}</p> : null}
        {collection.isLoading ? <p className="rounded-xl border p-5 text-sm text-muted-foreground" role="status">Carregando certificados...</p>
          : collection.error ? (
            <div className="space-y-3 rounded-xl border p-5"><p className="text-sm text-destructive" role="alert">{collection.error}</p><Button onClick={collection.retry} variant="outline">Tentar novamente</Button></div>
          ) : collection.items.length === 0 ? (
            <p className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">{filter === "Em análise" ? "Nenhum certificado aguardando avaliação." : "Nenhum certificado neste filtro."}</p>
          ) : (
            <ul className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
              {collection.items.map((submission) => (
                <li key={submission.id}>
                  <SubmissionCard
                    onReviewed={(updated) => {
                      collection.replace(updated, filter === "Todos" || filter === updated.status);
                      setNotice(`“${updated.title}” foi ${updated.status === "Aprovado" ? "aprovado" : "recusado"}.`);
                    }}
                    submission={submission}
                  />
                </li>
              ))}
            </ul>
          )}
      </section>
    </AppShell>
  );
}

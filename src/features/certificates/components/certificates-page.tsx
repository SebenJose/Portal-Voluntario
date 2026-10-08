"use client";

import { FileCheck2, Plus } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { SectionLink } from "@/components/section-link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AuthUser } from "@/features/auth/schemas/session-schema";
import { CertificateSubmissionForm } from "@/features/certificates/components/certificate-submission-form";
import { CertificateTotals } from "@/features/certificates/components/certificate-totals";
import { CertificateCard } from "@/features/certificates/components/certificate-card";
import { useCertificateHistory } from "@/features/certificates/hooks/use-certificate-history";
import { isDemoModeEnabled } from "@/lib/demo-mode";

export function CertificatesPage({ user }: { user: AuthUser }) {
  if (!isDemoModeEnabled) return (
    <AppShell active="certificates" description="Consulte seus comprovantes." title="Meus certificados" user={user}>
      <Card><CardContent className="p-6">O registro de certificados está disponível somente na demonstração. O serviço de homologação ainda não está integrado.</CardContent></Card>
    </AppShell>
  );
  return <CertificateHistory user={user} />;
}

function CertificateHistory({ user }: { user: AuthUser }) {
  const { certificates, isLoading, error, retry, downloadingId, downloadError, download } = useCertificateHistory(user.id);

  return (
    <AppShell active="certificates" description="Consulte suas atividades externas e os comprovantes registrados." title="Meus certificados" user={user}>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Nesta demonstração, os registros e arquivos ficam salvos apenas neste navegador. A análise é simulada e as horas declaradas ainda não são homologadas.
        </p>
        <Button className="shrink-0 bg-brand-yellow text-brand-black hover:bg-brand-yellow/85" nativeButton={false} render={<SectionLink sectionId="registrar-certificado" />}>
          <Plus aria-hidden="true" />Registrar certificado
        </Button>
      </div>

      {downloadError ? <p className="mb-5 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">{downloadError}</p> : null}

      <section aria-labelledby="certificates-history-title" className="space-y-5 scroll-mt-24" id="certificados-registrados">
        <h2 className="text-xl font-semibold" id="certificates-history-title">Certificados registrados</h2>
        {!isLoading && !error ? <Card><CardContent className="p-6"><CertificateTotals certificates={certificates} /></CardContent></Card> : null}
        {isLoading ? (
          <div aria-label="Carregando certificados" className="grid gap-5 md:grid-cols-2" role="status">
            {Array.from({ length: 2 }, (_, index) => <Skeleton className="h-72 rounded-2xl" key={index} />)}
          </div>
        ) : error ? (
          <Card><CardContent className="space-y-4 p-6"><p className="text-sm text-destructive" role="alert">{error}</p><Button onClick={retry} variant="outline">Tentar novamente</Button></CardContent></Card>
        ) : certificates.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-4 px-6 py-12 text-center">
              <div className="rounded-full bg-brand-yellow/15 p-4"><FileCheck2 aria-hidden="true" className="size-8 text-brand-black" /></div>
              <h3 className="text-xl font-semibold">Nenhum certificado registrado</h3>
              <p className="max-w-md text-sm leading-6 text-muted-foreground">Registre sua primeira atividade externa para consultar os dados e baixar o comprovante por aqui.</p>
              <Button nativeButton={false} render={<SectionLink sectionId="registrar-certificado" />} variant="outline">Registrar primeiro certificado</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <ul className="grid gap-5 md:grid-cols-2">
              {certificates.map((certificate) => <li key={certificate.id}><CertificateCard certificate={certificate} downloadDisabled={downloadingId !== null} isDownloading={downloadingId === certificate.id} onDownload={() => { void download(certificate); }} /></li>)}
            </ul>
          </div>
        )}
      </section>
      <CertificateSubmissionForm onSubmitted={retry} />
    </AppShell>
  );
}

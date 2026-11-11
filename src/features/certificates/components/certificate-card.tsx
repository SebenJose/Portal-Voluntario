import { CalendarDays, Clock3, Download, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCertificateDate, formatCertificateSize } from "@/features/certificates/lib/formatting";
import type { CertificateRecord } from "@/features/certificates/schemas/certificate-schema";
import { CertificateActions } from "@/features/certificates/components/certificate-actions";
import { certificateStatusStyles } from "@/features/certificates/lib/status";
import { activityCategoryStyles } from "@/lib/activity-categories";

type CertificateCardProps = {
  certificate: CertificateRecord;
  isDownloading: boolean;
  downloadDisabled: boolean;
  onDownload: () => void;
  onChanged: () => void;
};

export function CertificateCard({ certificate, isDownloading, downloadDisabled, onDownload, onChanged }: CertificateCardProps) {
  return (
    <Card aria-labelledby={`certificate-${certificate.id}-title`} as="article" className="h-full">
      <CardHeader>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <Badge className={activityCategoryStyles[certificate.category].badge} variant="outline">{certificate.category}</Badge>
          <Badge className={certificateStatusStyles[certificate.status]} variant="outline">{certificate.status}</Badge>
        </div>
        <CardTitle as="h3" className="break-words text-lg leading-6" id={`certificate-${certificate.id}-title`}>{certificate.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <p className="break-words text-sm leading-6 text-muted-foreground">{certificate.description}</p>
        <dl className="space-y-2 text-sm text-muted-foreground">
          <div><dt className="sr-only">Horas declaradas</dt><dd className="flex items-center gap-2"><Clock3 aria-hidden="true" className="size-4 shrink-0" />{certificate.hours}h declaradas</dd></div>
          <div><dt className="sr-only">Data do registro</dt><dd className="flex items-center gap-2"><CalendarDays aria-hidden="true" className="size-4 shrink-0" /><span>Registrado em <time dateTime={certificate.createdAt}>{formatCertificateDate(certificate.createdAt)}</time></span></dd></div>
          <div><dt className="sr-only">Comprovante</dt><dd className="flex items-center gap-2"><FileText aria-hidden="true" className="size-4 shrink-0" /><span className="break-all">{certificate.document.name} · {formatCertificateSize(certificate.document.size)}</span></dd></div>
        </dl>
        {certificate.review ? (
          <p className="rounded-lg border px-3 py-2 text-sm" role="note">
            <span className="font-medium">{certificate.status === "Aprovado" ? "Aprovado" : "Recusado"} pela administração</span> em <time dateTime={certificate.review.reviewedAt}>{formatCertificateDate(certificate.review.reviewedAt)}</time>
            {certificate.review.note ? <>: {certificate.review.note}</> : "."}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">Protocolo {certificate.id}</p>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        <Button aria-busy={isDownloading} aria-label={`Baixar comprovante de ${certificate.title}`} disabled={downloadDisabled} onClick={onDownload} variant="outline">
          <Download aria-hidden="true" />{isDownloading ? "Baixando..." : "Baixar comprovante"}
        </Button>
        {certificate.status === "Em análise"
          ? <CertificateActions certificate={certificate} onChanged={onChanged} />
          : <p className="text-sm text-muted-foreground">Registros avaliados não podem ser editados ou excluídos.</p>}
      </CardFooter>
    </Card>
  );
}

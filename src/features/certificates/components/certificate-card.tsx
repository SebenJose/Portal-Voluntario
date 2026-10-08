import { CalendarDays, Clock3, Download, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCertificateDate, formatCertificateSize } from "@/features/certificates/lib/formatting";
import type { CertificateRecord } from "@/features/certificates/schemas/certificate-schema";
import { activityCategoryStyles } from "@/lib/activity-categories";

type CertificateCardProps = {
  certificate: CertificateRecord;
  isDownloading: boolean;
  downloadDisabled: boolean;
  onDownload: () => void;
};

export function CertificateCard({ certificate, isDownloading, downloadDisabled, onDownload }: CertificateCardProps) {
  return (
    <Card aria-labelledby={`certificate-${certificate.id}-title`} as="article" className="h-full">
      <CardHeader>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <Badge className={activityCategoryStyles[certificate.category].badge} variant="outline">{certificate.category}</Badge>
          <Badge variant="secondary">{certificate.status}</Badge>
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
        <p className="text-xs text-muted-foreground">Protocolo {certificate.id}</p>
      </CardContent>
      <CardFooter>
        <Button aria-busy={isDownloading} aria-label={`Baixar comprovante de ${certificate.title}`} disabled={downloadDisabled} onClick={onDownload} variant="outline">
          <Download aria-hidden="true" />{isDownloading ? "Baixando..." : "Baixar comprovante"}
        </Button>
      </CardFooter>
    </Card>
  );
}

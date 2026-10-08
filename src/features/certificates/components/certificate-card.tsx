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
    <Card className="h-full">
      <CardHeader>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <Badge className={activityCategoryStyles[certificate.category].badge} variant="outline">{certificate.category}</Badge>
          <Badge variant="secondary">{certificate.status}</Badge>
        </div>
        <CardTitle className="break-words text-lg leading-6">{certificate.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <p className="break-words text-sm leading-6 text-muted-foreground">{certificate.description}</p>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="flex items-center gap-2"><Clock3 aria-hidden="true" className="size-4 shrink-0" />{certificate.hours}h declaradas</p>
          <p className="flex items-center gap-2"><CalendarDays aria-hidden="true" className="size-4 shrink-0" />Registrado em {formatCertificateDate(certificate.createdAt)}</p>
          <p className="flex items-center gap-2"><FileText aria-hidden="true" className="size-4 shrink-0" /><span className="break-all">{certificate.document.name} · {formatCertificateSize(certificate.document.size)}</span></p>
        </div>
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

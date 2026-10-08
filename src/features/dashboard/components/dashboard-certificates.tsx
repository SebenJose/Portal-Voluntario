"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CertificateTotals } from "@/features/certificates/components/certificate-totals";
import { useCertificateHistory } from "@/features/certificates/hooks/use-certificate-history";

export function DashboardCertificates({ userId }: { userId: string }) {
  const history = useCertificateHistory(userId);
  return (
    <Card aria-labelledby="dashboard-certificates-title" as="section" className="border-brand-yellow/30">
      <CardHeader><CardTitle id="dashboard-certificates-title">Certificados lançados</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {history.isLoading ? <p className="text-sm text-muted-foreground" role="status">Carregando resumo dos certificados...</p> : history.error ? <div className="space-y-3"><p className="text-sm text-destructive" role="alert">{history.error}</p><Button onClick={history.retry} variant="outline">Tentar novamente</Button></div> : <CertificateTotals certificates={history.certificates} />}
        <Button className="w-full" nativeButton={false} render={<Link href="/certificados" />} variant="outline">Ver e registrar certificados</Button>
      </CardContent>
    </Card>
  );
}

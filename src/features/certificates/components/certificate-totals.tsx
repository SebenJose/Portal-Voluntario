import { summarizeCertificates } from "@/features/certificates/lib/summary";
import type { CertificateRecord } from "@/features/certificates/schemas/certificate-schema";
import { activityCategoryStyles } from "@/lib/activity-categories";

export function CertificateTotals({ certificates }: { certificates: readonly CertificateRecord[] }) {
  const summary = summarizeCertificates(certificates);
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-3 gap-4">
        <div><dt className="text-sm text-muted-foreground">Certificados registrados</dt><dd className="mt-1 text-3xl font-semibold">{summary.count}</dd></div>
        <div><dt className="text-sm text-muted-foreground">Horas aprovadas</dt><dd className="mt-1 text-3xl font-semibold">{summary.approvedHours}h</dd></div>
        <div><dt className="text-sm text-muted-foreground">Horas em análise</dt><dd className="mt-1 text-3xl font-semibold">{summary.underReviewHours}h</dd></div>
      </dl>
      <dl className="flex flex-wrap gap-4 text-sm">
        {summary.categories.map((item) => <div className="flex items-center gap-1.5" key={item.category}><span aria-hidden="true" className={`size-2 rounded-full ${activityCategoryStyles[item.category].indicator}`} /><dt>{item.category}:</dt><dd className="font-medium">{item.hours}h</dd></div>)}
      </dl>
      <p className="text-xs leading-5 text-muted-foreground">Horas declaradas por eixo. Só as aprovadas pela administração entram no banco de horas; as em análise ainda aguardam avaliação.</p>
    </div>
  );
}

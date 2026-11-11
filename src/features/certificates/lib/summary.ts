import type { CertificateRecord } from "@/features/certificates/schemas/certificate-schema";
import { activityCategories } from "@/lib/activity-categories";

const sumHours = (records: readonly CertificateRecord[]) => records.reduce((total, record) => total + record.hours, 0);

export function summarizeCertificates(records: readonly CertificateRecord[]) {
  return {
    count: records.length,
    declaredHours: sumHours(records),
    underReviewHours: sumHours(records.filter((record) => record.status === "Em análise")),
    approvedHours: sumHours(records.filter((record) => record.status === "Aprovado")),
    categories: activityCategories.map((category) => ({ category, hours: records.filter((record) => record.category === category).reduce((total, record) => total + record.hours, 0) })),
  };
}

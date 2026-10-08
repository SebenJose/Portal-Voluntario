import type { CertificateRecord } from "@/features/certificates/schemas/certificate-schema";
import { activityCategories } from "@/lib/activity-categories";

export function summarizeCertificates(records: readonly CertificateRecord[]) {
  return {
    count: records.length,
    declaredHours: records.reduce((total, record) => total + record.hours, 0),
    categories: activityCategories.map((category) => ({ category, hours: records.filter((record) => record.category === category).reduce((total, record) => total + record.hours, 0) })),
  };
}

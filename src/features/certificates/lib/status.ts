import type { CertificateStatus } from "@/features/certificates/schemas/certificate-schema";
import { statusBadgeStyles } from "@/lib/status-styles";

export const certificateStatusStyles: Record<CertificateStatus, string> = {
  "Em análise": statusBadgeStyles.neutral,
  Aprovado: statusBadgeStyles.positive,
  Recusado: statusBadgeStyles.negative,
};

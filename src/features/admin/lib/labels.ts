import type { OrganizationStatus } from "@/features/auth/schemas/session-schema";
import { statusBadgeStyles } from "@/lib/status-styles";

export const organizationStatusLabels: Record<OrganizationStatus, string> = {
  pending: "Aguardando aprovação",
  approved: "Aprovada",
  rejected: "Recusada",
};

export const organizationStatusStyles: Record<OrganizationStatus, string> = {
  pending: statusBadgeStyles.neutral,
  approved: statusBadgeStyles.positive,
  rejected: statusBadgeStyles.negative,
};

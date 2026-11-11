import { z } from "zod";

import { organizationStatuses } from "@/features/auth/schemas/session-schema";
import { certificateRecordSchema } from "@/features/certificates/schemas/certificate-schema";

export const managedOrganizationSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  status: z.enum(organizationStatuses),
  reviewedAt: z.iso.datetime().nullable(),
  owner: z.object({ name: z.string().min(1), email: z.email() }),
  activities: z.number().int().nonnegative(),
});

export const managedOrganizationListSchema = z.array(managedOrganizationSchema);

export const reviewSubmissionSchema = certificateRecordSchema.extend({
  volunteer: z.object({ name: z.string().min(1), email: z.email() }),
});

export const reviewSubmissionListSchema = z.object({ items: z.array(reviewSubmissionSchema) });

export const organizationDecisionSchema = z.object({ status: z.enum(["approved", "rejected"]) });

/** Formulário de avaliação: a justificativa é obrigatória somente ao recusar. */
export const submissionReviewSchema = z.object({
  status: z.enum(["Aprovado", "Recusado"]),
  note: z.string().trim().max(1000, "Use até 1000 caracteres."),
}).superRefine((values, context) => {
  if (values.status === "Recusado" && values.note.length < 5) {
    context.addIssue({ code: "custom", path: ["note"], message: "Explique o motivo da recusa com pelo menos 5 caracteres." });
  }
});

export type ManagedOrganization = z.infer<typeof managedOrganizationSchema>;
export type ReviewSubmission = z.infer<typeof reviewSubmissionSchema>;
export type OrganizationDecision = z.infer<typeof organizationDecisionSchema>["status"];
export type SubmissionReviewValues = z.infer<typeof submissionReviewSchema>;

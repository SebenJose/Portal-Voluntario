import { z } from "zod";

import {
  managedOrganizationListSchema, managedOrganizationSchema, organizationDecisionSchema, reviewSubmissionListSchema,
  reviewSubmissionSchema, submissionReviewSchema, type ManagedOrganization, type OrganizationDecision, type ReviewSubmission,
  type SubmissionReviewValues,
} from "@/features/admin/schemas/admin-schema";
import type { OrganizationStatus } from "@/features/auth/schemas/session-schema";
import type { CertificateStatus } from "@/features/certificates/schemas/certificate-schema";
import { downloadDocument } from "@/features/certificates/services/certificates";

export class AdminServiceError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "AdminServiceError";
  }
}

async function request<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { cache: "no-store", ...init });
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new AdminServiceError("Não foi possível conectar à administração. Tente novamente.");
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const parsed = z.object({ message: z.string().min(1) }).safeParse(body);
    throw new AdminServiceError(parsed.success ? parsed.data.message : "Não foi possível concluir a operação. Tente novamente.", response.status);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new AdminServiceError("A administração retornou dados inválidos.");
  return parsed.data;
}

const json = (body: unknown): RequestInit => ({ method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export function getOrganizations(status?: OrganizationStatus, signal?: AbortSignal): Promise<ManagedOrganization[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return request(`/api/admin/organizations${query}`, managedOrganizationListSchema, { signal });
}

export function decideOrganization(id: string, status: OrganizationDecision): Promise<ManagedOrganization> {
  return request(`/api/admin/organizations/${encodeURIComponent(id)}`, managedOrganizationSchema, json(organizationDecisionSchema.parse({ status })));
}

export async function getReviewSubmissions(status?: CertificateStatus, signal?: AbortSignal): Promise<ReviewSubmission[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return (await request(`/api/admin/submissions${query}`, reviewSubmissionListSchema, { signal })).items;
}

export function reviewSubmission(id: string, values: SubmissionReviewValues): Promise<ReviewSubmission> {
  const parsed = submissionReviewSchema.parse(values);
  const body = parsed.note.length > 0 ? parsed : { status: parsed.status };
  return request(`/api/admin/submissions/${encodeURIComponent(id)}/review`, reviewSubmissionSchema, json(body));
}

export function downloadReviewDocument(submission: ReviewSubmission): Promise<void> {
  return downloadDocument(`/api/admin/submissions/${encodeURIComponent(submission.id)}/document`, submission.document.name);
}

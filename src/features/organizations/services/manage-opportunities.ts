import { z } from "zod";
import { opportunitySchema } from "@/features/opportunities/schemas/opportunity-schema";
import { opportunityFormSchema, type OpportunityFormInput, type OpportunityFormValues } from "@/features/organizations/schemas/opportunity-form-schema";
import { OrganizationActivitiesError } from "@/features/organizations/services/organization-activities";

async function request(path: string, options?: RequestInit): Promise<Response> {
  let response: Response;
  try { response = await fetch(path, { ...options, cache: "no-store" }); }
  catch { throw new OrganizationActivitiesError("Não foi possível conectar à gestão de atividades."); }
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const error = z.object({ message: z.string() }).safeParse(body);
    throw new OrganizationActivitiesError(error.success ? error.data.message : "Não foi possível salvar a atividade.", response.status);
  }
  return response;
}

export async function getEditableOpportunity(id: string): Promise<OpportunityFormInput> {
  const response = await request(`/api/opportunities/${encodeURIComponent(id)}`);
  const raw: unknown = await response.json();
  const parsed = opportunitySchema.safeParse(raw);
  if (!parsed.success) throw new OrganizationActivitiesError("A atividade retornou dados inválidos.");
  const item = parsed.data;
  return { id: item.id, title: item.title, description: item.description, category: item.category, format: item.format,
    location: item.location, dateLabel: item.dateLabel, durationLabel: item.durationLabel, hours: String(item.hours),
    vacancies: String(item.vacancies), featured: item.featured ?? false, sessions: item.sessions };
}

export async function saveOpportunity(input: OpportunityFormValues, editing: boolean): Promise<void> {
  // The form has already transformed numeric drafts; validate them again using the API contract.
  const parsed = opportunityFormSchema.safeParse({ ...input, hours: String(input.hours), vacancies: String(input.vacancies) });
  if (!parsed.success) throw new OrganizationActivitiesError("Confira os dados da atividade.");
  const { id, ...fields } = parsed.data;
  const response = await request(editing ? `/api/opportunities/${encodeURIComponent(id)}` : "/api/opportunities", {
    method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing ? fields : parsed.data),
  });
  const result: unknown = await response.json();
  if (!opportunitySchema.safeParse(result).success) throw new OrganizationActivitiesError("O serviço retornou uma atividade inválida.");
}

export async function deleteOpportunity(id: string): Promise<void> {
  await request(`/api/opportunities/${encodeURIComponent(id)}`, { method: "DELETE" });
}

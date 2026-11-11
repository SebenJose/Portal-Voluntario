import { opportunitiesResponseSchema, registrationResponseSchema, type OpportunitiesResponse, type RegistrationResponse, cancellationResponseSchema, type CancellationResponse } from "@/features/opportunities/schemas/opportunity-schema";
import type { OpportunityCategory } from "@/features/opportunities/types";

export type { OpportunitiesResponse, RegistrationResponse } from "@/features/opportunities/schemas/opportunity-schema";

export class OpportunitiesServiceError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "OpportunitiesServiceError";
  }
}

export type OpportunityFilters = { search?: string; category?: OpportunityCategory };

export async function getOpportunities(filters: OpportunityFilters = {}, signal?: AbortSignal): Promise<OpportunitiesResponse> {
  const query = new URLSearchParams();
  const search = filters.search?.trim().slice(0, 100);
  if (search) query.set("search", search);
  if (filters.category) query.set("category", filters.category);
  const path = query.size > 0 ? `/api/opportunities?${query.toString()}` : "/api/opportunities";
  let response: Response;

  try {
    response = await fetch(path, { signal, cache: "no-store" });
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new OpportunitiesServiceError("Não foi possível conectar ao catálogo. Tente novamente.");
  }

  if (!response.ok) {
    throw new OpportunitiesServiceError(response.status === 401 ? "Sua sessão expirou. Entre novamente para continuar." : "Não foi possível carregar as oportunidades. Tente novamente.", response.status);
  }

  const result: unknown = await response.json().catch(() => null);
  const parsedResult = opportunitiesResponseSchema.safeParse(result);

  if (!parsedResult.success) {
    throw new OpportunitiesServiceError("O catálogo retornou dados inválidos. Tente novamente.");
  }

  return parsedResult.data;
}

export async function registerForOpportunity(opportunityId: string): Promise<RegistrationResponse> {
  let response: Response;

  try {
    response = await fetch(`/api/opportunities/${encodeURIComponent(opportunityId)}/registrations`, {
      method: "POST",
    });
  } catch {
    throw new OpportunitiesServiceError("Não foi possível conectar ao serviço de inscrições. Tente novamente.");
  }

  if (response.status === 401) {
    throw new OpportunitiesServiceError("Entre na sua conta para se inscrever.", 401);
  }

  if (response.status === 409) {
    throw new OpportunitiesServiceError("Você já está inscrito ou as vagas foram preenchidas.", 409);
  }

  if (!response.ok) {
    throw new OpportunitiesServiceError("Não foi possível concluir a inscrição. Tente novamente.", response.status);
  }

  const result: unknown = await response.json().catch(() => null);
  const parsedResult = registrationResponseSchema.safeParse(result);

  if (!parsedResult.success) {
    throw new OpportunitiesServiceError("O serviço de inscrições retornou uma resposta inválida.");
  }

  return parsedResult.data;
}

export async function cancelOpportunityRegistration(opportunityId: string): Promise<CancellationResponse> {
  let response: Response;
  try {
    response = await fetch(`/api/opportunities/${encodeURIComponent(opportunityId)}/registrations`, { method: "DELETE" });
  } catch {
    throw new OpportunitiesServiceError("Não foi possível conectar ao serviço de inscrições. Tente novamente.");
  }
  if (response.status === 401) {
    throw new OpportunitiesServiceError("Entre na sua conta para cancelar a inscrição.", 401);
  }
  if (response.status === 404) {
    throw new OpportunitiesServiceError("Esta inscrição não foi encontrada. Atualize a lista e tente novamente.", 404);
  }
  if (!response.ok) {
    throw new OpportunitiesServiceError("Não foi possível cancelar a inscrição. Tente novamente.", response.status);
  }
  const result: unknown = await response.json().catch(() => null);
  const parsed = cancellationResponseSchema.safeParse(result);
  if (!parsed.success) throw new OpportunitiesServiceError("O serviço retornou uma resposta inválida ao cancelar a inscrição.");
  return parsed.data;
}

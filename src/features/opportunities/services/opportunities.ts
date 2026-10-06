import { opportunitiesResponseSchema, registrationResponseSchema, type OpportunitiesResponse, type RegistrationResponse } from "@/features/opportunities/schemas/opportunity-schema";

export type { OpportunitiesResponse, RegistrationResponse } from "@/features/opportunities/schemas/opportunity-schema";

export class OpportunitiesServiceError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "OpportunitiesServiceError";
  }
}

export async function getOpportunities(signal?: AbortSignal): Promise<OpportunitiesResponse> {
  let response: Response;

  try {
    response = await fetch("/api/opportunities", { signal });
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new OpportunitiesServiceError("Não foi possível conectar ao catálogo. Tente novamente.");
  }

  if (!response.ok) {
    throw new OpportunitiesServiceError("Não foi possível carregar as oportunidades. Tente novamente.");
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

import { z } from "zod";

import { opportunityCategories } from "../types";

const opportunitySchema = z.object({
  id: z.string(),
  title: z.string(),
  organization: z.string(),
  description: z.string(),
  category: z.enum(opportunityCategories),
  format: z.enum(["Presencial", "Híbrido", "Online"]),
  location: z.string(),
  dateLabel: z.string(),
  durationLabel: z.string(),
  hours: z.number(),
  vacancies: z.number(),
  enrolled: z.number(),
  featured: z.boolean().optional(),
});

const opportunitiesResponseSchema = z.object({
  items: z.array(opportunitySchema),
  registeredIds: z.array(z.string()),
});

const registrationResponseSchema = z.object({
  opportunityId: z.string(),
  registered: z.literal(true),
  enrolled: z.number(),
});

export type OpportunitiesResponse = z.infer<typeof opportunitiesResponseSchema>;
export type RegistrationResponse = z.infer<typeof registrationResponseSchema>;

export class OpportunitiesServiceError extends Error {
  constructor(message: string) {
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

  if (response.status === 409) {
    throw new OpportunitiesServiceError("As vagas desta oportunidade foram preenchidas.");
  }

  if (!response.ok) {
    throw new OpportunitiesServiceError("Não foi possível concluir a inscrição. Tente novamente.");
  }

  const result: unknown = await response.json().catch(() => null);
  const parsedResult = registrationResponseSchema.safeParse(result);

  if (!parsedResult.success) {
    throw new OpportunitiesServiceError("O serviço de inscrições retornou uma resposta inválida.");
  }

  return parsedResult.data;
}

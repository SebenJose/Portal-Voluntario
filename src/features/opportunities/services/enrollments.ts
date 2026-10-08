import { z } from "zod";

import { opportunities } from "@/features/opportunities/data/opportunities";
import { opportunitySchema, opportunitiesResponseSchema, registrationResponseSchema, type OpportunitiesResponse, type RegistrationResponse, cancellationResponseSchema, type CancellationResponse } from "@/features/opportunities/schemas/opportunity-schema";
import { readLocalData, updateLocalData } from "@/lib/server/local-store";

const catalog = z.array(opportunitySchema).parse(opportunities);
const enrollmentsSchema = z.array(z.object({ userId: z.string().min(1), opportunityId: z.string().min(1) }));
const enrollmentsFile = "enrollments.json";

export class EnrollmentError extends Error {
  constructor(message: string, readonly status: 404 | 409) {
    super(message);
    this.name = "EnrollmentError";
  }
}

export function getOpportunityCatalog(userId?: string): OpportunitiesResponse {
  const enrollments = readLocalData(enrollmentsFile, enrollmentsSchema, []);
  return opportunitiesResponseSchema.parse({
    items: catalog.map((opportunity) => ({
      ...opportunity,
      enrolled: opportunity.enrolled + enrollments.filter((item) => item.opportunityId === opportunity.id).length,
    })),
    registeredIds: userId ? enrollments.filter((item) => item.userId === userId).map((item) => item.opportunityId) : [],
  });
}

export function enrollInOpportunity(userId: string, opportunityId: string): RegistrationResponse {
  const opportunity = catalog.find((item) => item.id === opportunityId);
  if (!opportunity) throw new EnrollmentError("Oportunidade não encontrada.", 404);
  const enrollments = updateLocalData(enrollmentsFile, enrollmentsSchema, [], (current) => {
    if (current.some((item) => item.userId === userId && item.opportunityId === opportunityId)) {
      throw new EnrollmentError("Você já está inscrito nesta oportunidade.", 409);
    }
    const enrolled = opportunity.enrolled + current.filter((item) => item.opportunityId === opportunityId).length;
    if (enrolled >= opportunity.vacancies) throw new EnrollmentError("As vagas desta oportunidade foram preenchidas.", 409);
    return [...current, { userId, opportunityId }];
  });
  return registrationResponseSchema.parse({
    opportunityId,
    registered: true,
    enrolled: opportunity.enrolled + enrollments.filter((item) => item.opportunityId === opportunityId).length,
  });
}

export function cancelEnrollment(userId: string, opportunityId: string): CancellationResponse {
  const opportunity = catalog.find((item) => item.id === opportunityId);
  if (!opportunity) throw new EnrollmentError("Oportunidade não encontrada.", 404);
  const enrollments = updateLocalData(enrollmentsFile, enrollmentsSchema, [], (current) => {
    if (!current.some((item) => item.userId === userId && item.opportunityId === opportunityId)) {
      throw new EnrollmentError("Você não possui inscrição nesta oportunidade.", 404);
    }
    return current.filter((item) => item.userId !== userId || item.opportunityId !== opportunityId);
  });
  return cancellationResponseSchema.parse({
    opportunityId,
    registered: false,
    enrolled: opportunity.enrolled + enrollments.filter((item) => item.opportunityId === opportunityId).length,
  });
}

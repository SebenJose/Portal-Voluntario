import { http, HttpResponse, passthrough, type RequestHandler } from "msw";

import { opportunities } from "@/features/opportunities/data/opportunities";

type HealthResponse = {
  status: "ok";
};

const registeredOpportunityIds = new Set<string>();
const enrolledCounts = new Map(opportunities.map((opportunity) => [opportunity.id, opportunity.enrolled]));

export const handlers = [
  http.all("/api/auth/*", () => passthrough()),
  http.get("/api/health", () => {
    const response: HealthResponse = { status: "ok" };

    return HttpResponse.json(response);
  }),
  http.get("/api/opportunities", ({ request }) => {
    const scenario = new URL(request.url).searchParams.get("scenario");

    if (scenario === "empty") {
      return HttpResponse.json({ items: [], registeredIds: [] });
    }

    if (scenario === "server-error") {
      return HttpResponse.json({ message: "Falha simulada ao carregar o catálogo." }, { status: 500 });
    }

    return HttpResponse.json({
      items: opportunities.map((opportunity) => ({
        ...opportunity,
        enrolled: enrolledCounts.get(opportunity.id) ?? opportunity.enrolled,
      })),
      registeredIds: Array.from(registeredOpportunityIds),
    });
  }),
  http.post("/api/opportunities/:id/registrations", ({ params }) => {
    const opportunityId = params.id;
    const opportunity = opportunities.find((item) => item.id === opportunityId);

    if (!opportunity) {
      return HttpResponse.json({ message: "Oportunidade não encontrada." }, { status: 404 });
    }

    if (registeredOpportunityIds.has(opportunity.id)) {
      return HttpResponse.json({ message: "Você já está inscrito nesta oportunidade." }, { status: 409 });
    }

    const enrolled = enrolledCounts.get(opportunity.id) ?? opportunity.enrolled;

    if (enrolled >= opportunity.vacancies) {
      return HttpResponse.json({ message: "Não há vagas disponíveis." }, { status: 409 });
    }

    registeredOpportunityIds.add(opportunity.id);
    const nextEnrolledCount = enrolled + 1;
    enrolledCounts.set(opportunity.id, nextEnrolledCount);

    return HttpResponse.json(
      { opportunityId: opportunity.id, registered: true, enrolled: nextEnrolledCount },
      { status: 201 },
    );
  }),
] satisfies Array<RequestHandler>;

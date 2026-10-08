import { http, HttpResponse, passthrough, type RequestHandler } from "msw";

import { certificateHandlers } from "@/features/certificates/mocks/handlers";
import { organizationHandlers } from "@/features/organizations/mocks/handlers";

type HealthResponse = {
  status: "ok";
};

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

    return passthrough();
  }),
  http.post("/api/opportunities/:id/registrations", () => passthrough()),
  http.delete("/api/opportunities/:id/registrations", () => passthrough()),
  ...organizationHandlers,
  ...certificateHandlers,
] satisfies Array<RequestHandler>;

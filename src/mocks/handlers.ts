import { http, HttpResponse, type RequestHandler } from "msw";

type HealthResponse = {
  status: "ok";
};

export const handlers = [
  http.get("/api/health", () => {
    const response: HealthResponse = { status: "ok" };

    return HttpResponse.json(response);
  }),
] satisfies Array<RequestHandler>;

import { http, HttpResponse, passthrough, type RequestHandler } from "msw";

type HealthResponse = {
  status: "ok";
};

export const handlers = [
  http.all("/api/auth/*", () => passthrough()),
  http.get("/api/health", () => {
    const response: HealthResponse = { status: "ok" };

    return HttpResponse.json(response);
  }),
] satisfies Array<RequestHandler>;

import { delay, http, HttpResponse } from "msw";

import { dashboardPresentation } from "@/features/dashboard/mocks/fixtures";

export const dashboardPresentationHandlers = [
  http.get("/api/demo/dashboard", async ({ request }) => {
    const scenario = new URL(request.url).searchParams.get("scenario");
    if (scenario === "network-error") return HttpResponse.error();
    if (scenario === "server-error") return HttpResponse.json({ message: "Não foi possível carregar os exemplos." }, { status: 500 });
    if (scenario === "loading") await delay(1500);
    if (scenario === "empty") return HttpResponse.json({ hoursSummary: [], completedActivities: [], registeredActivities: [] });
    return HttpResponse.json(dashboardPresentation);
  }),
];

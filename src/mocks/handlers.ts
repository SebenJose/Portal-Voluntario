import { http, HttpResponse, passthrough, type RequestHandler } from "msw";
import { z } from "zod";

import type { ManagedActivity } from "@/features/organizations/types";
import { certificateHandlers } from "@/features/certificates/mocks/handlers";

type HealthResponse = {
  status: "ok";
};

const organizationActivities: Array<ManagedActivity> = [
  {
    id: "horta-comunitaria",
    title: "Horta comunitária e educação ambiental",
    dateLabel: "12 de outubro · Santa Helena",
    certificatesDispatched: false,
    participants: [
      { id: "p-001", name: "Ana Clara Martins", email: "ana.martins@alunos.utfpr.edu.br", registeredAt: "28 set 2026", status: "Presente" },
      { id: "p-002", name: "Bruno Henrique Lima", email: "bruno.lima@alunos.utfpr.edu.br", registeredAt: "29 set 2026", status: "Inscrito" },
      { id: "p-003", name: "Camila Rocha Silva", email: "camila.silva@alunos.utfpr.edu.br", registeredAt: "30 set 2026", status: "Presente" },
      { id: "p-004", name: "Diego Ferreira Costa", email: "diego.costa@alunos.utfpr.edu.br", registeredAt: "01 out 2026", status: "Ausente" },
      { id: "p-005", name: "Elisa Mendes Alves", email: "elisa.alves@alunos.utfpr.edu.br", registeredAt: "02 out 2026", status: "Inscrito" },
    ],
  },
  {
    id: "monitoria-programacao",
    title: "Monitoria de programação para iniciantes",
    dateLabel: "20 de outubro · UTFPR Santa Helena",
    certificatesDispatched: false,
    participants: [
      { id: "p-006", name: "Felipe Nunes Prado", email: "felipe.prado@alunos.utfpr.edu.br", registeredAt: "25 set 2026", status: "Inscrito" },
      { id: "p-007", name: "Giovana Alves Mendes", email: "giovana.mendes@alunos.utfpr.edu.br", registeredAt: "26 set 2026", status: "Inscrito" },
      { id: "p-008", name: "Heitor Santos Lima", email: "heitor.lima@alunos.utfpr.edu.br", registeredAt: "27 set 2026", status: "Inscrito" },
    ],
  },
];

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
  http.get("/api/organizations/activities", () => {
    return HttpResponse.json(organizationActivities);
  }),
  http.patch(
    "/api/organizations/activities/:activityId/participants/:participantId",
    async ({ params, request }) => {
      const payload: unknown = await request.json().catch(() => null);
      const bodySchema = z.object({ status: z.enum(["Inscrito", "Presente", "Ausente"]) });
      const parsedBody = bodySchema.safeParse(payload);

      if (!parsedBody.success) {
        return HttpResponse.json({ message: "Status de presença inválido." }, { status: 400 });
      }

      const activity = organizationActivities.find(({ id }) => id === params.activityId);
      const participant = activity?.participants.find(({ id }) => id === params.participantId);

      if (!activity || !participant) {
        return HttpResponse.json({ message: "Atividade ou participante não encontrado." }, { status: 404 });
      }

      participant.status = parsedBody.data.status;
      return HttpResponse.json({ participant });
    },
  ),
  http.post("/api/organizations/activities/:activityId/certificates", ({ params }) => {
    const activity = organizationActivities.find(({ id }) => id === params.activityId);

    if (!activity) {
      return HttpResponse.json({ message: "Atividade não encontrada." }, { status: 404 });
    }

    if (activity.certificatesDispatched) {
      return HttpResponse.json({ message: "Os certificados desta atividade já foram despachados." }, { status: 409 });
    }

    const sentCount = activity.participants.filter(({ status }) => status === "Presente").length;

    if (sentCount === 0) {
      return HttpResponse.json({ message: "Não há participantes com presença confirmada." }, { status: 409 });
    }

    activity.certificatesDispatched = true;
    return HttpResponse.json(
      { activityId: activity.id, sentCount, certificatesDispatched: true },
      { status: 201 },
    );
  }),
  ...certificateHandlers,
] satisfies Array<RequestHandler>;

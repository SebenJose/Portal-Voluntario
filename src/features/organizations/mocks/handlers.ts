import { delay, http, HttpResponse, type RequestHandler } from "msw";
import { z } from "zod";

import { requireMockOrganization } from "@/features/organizations/mocks/authorization";
import { organizationActivities } from "@/features/organizations/mocks/fixtures";
import { activityListSchema, type ManagedActivity } from "@/features/organizations/services/organization-activities";

const activitiesByOwner = new Map<string, Array<ManagedActivity>>();

function getOwnerActivities(ownerId: string): Array<ManagedActivity> {
  const stored = activitiesByOwner.get(ownerId);
  if (stored) return stored;
  const activities = activityListSchema.parse(structuredClone(organizationActivities));
  activitiesByOwner.set(ownerId, activities);
  return activities;
}

// Public demo state belongs to this browser module and never touches organization data.
const publicDemoActivities = activityListSchema.parse(structuredClone(organizationActivities));

function createManagementHandlers(
  basePath: string,
  resolveActivities: () => Promise<ManagedActivity[] | Response>,
): RequestHandler[] {
  return [
    http.get(basePath, async ({ request }) => {
      const activities = await resolveActivities();
      if (activities instanceof Response) return activities;
      const scenario = new URL(request.url).searchParams.get("scenario");
      if (scenario === "empty") return HttpResponse.json([]);
      if (scenario === "server-error") return HttpResponse.json({ message: "Falha simulada ao carregar atividades." }, { status: 500 });
      if (scenario === "network-error") return HttpResponse.error();
      if (scenario === "loading") await delay(1500);
      return HttpResponse.json(activities);
    }),
    http.patch(
      `${basePath}/:activityId/participants/:participantId`,
      async ({ params, request }) => {
        const activities = await resolveActivities();
        if (activities instanceof Response) return activities;
        const payload: unknown = await request.json().catch(() => null);
        const bodySchema = z.object({ status: z.enum(["Inscrito", "Presente", "Ausente"]) });
        const parsedBody = bodySchema.safeParse(payload);

        if (!parsedBody.success) {
          return HttpResponse.json({ message: "Status de presença inválido." }, { status: 400 });
        }

        const activity = activities.find(({ id }) => id === params.activityId);
        const participant = activity?.participants.find(({ id }) => id === params.participantId);

        if (!activity || !participant) {
          return HttpResponse.json({ message: "Atividade ou participante não encontrado." }, { status: 404 });
        }

        if (activity.certificatesDispatched) {
          return HttpResponse.json({ message: "A presença está encerrada após o despacho." }, { status: 409 });
        }
        participant.status = parsedBody.data.status;
        return HttpResponse.json({ participant });
      },
    ),
    http.post(`${basePath}/:activityId/certificates`, async ({ params }) => {
      const activities = await resolveActivities();
      if (activities instanceof Response) return activities;
      const activity = activities.find(({ id }) => id === params.activityId);

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
  ];
}

export const organizationHandlers: RequestHandler[] = [
  ...createManagementHandlers("/api/organizations/activities", async () => {
    const user = await requireMockOrganization();
    return user instanceof Response ? user : getOwnerActivities(user.id);
  }),
  ...createManagementHandlers("/api/demo/organizations/activities", async () => publicDemoActivities),
];

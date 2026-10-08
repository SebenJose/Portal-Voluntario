import { z } from "zod";

import { attendanceStatuses } from "../types";

const participantSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  registeredAt: z.string(),
  status: z.enum(attendanceStatuses),
});

const managedActivitySchema = z.object({
  id: z.string(),
  title: z.string(),
  dateLabel: z.string(),
  participants: z.array(participantSchema),
  certificatesDispatched: z.boolean(),
});

const activityListSchema = z.array(managedActivitySchema);

const attendanceUpdateSchema = z.object({
  participant: participantSchema,
});

const certificateDispatchSchema = z.object({
  activityId: z.string(),
  sentCount: z.number().int().nonnegative(),
  certificatesDispatched: z.literal(true),
});

export type ManagedActivity = z.infer<typeof managedActivitySchema>;
export type ActivityParticipant = z.infer<typeof participantSchema>;
export type AttendanceStatus = z.infer<typeof participantSchema>["status"];
export type CertificateDispatchReceipt = z.infer<typeof certificateDispatchSchema>;

export class OrganizationActivitiesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrganizationActivitiesError";
  }
}

async function readJson<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
  if (!response.ok) {
    throw new OrganizationActivitiesError("A solicitação não pôde ser concluída. Tente novamente.");
  }

  const payload: unknown = await response.json().catch(() => null);
  const parsedPayload = schema.safeParse(payload);

  if (!parsedPayload.success) {
    throw new OrganizationActivitiesError("O serviço retornou dados inválidos.");
  }

  return parsedPayload.data;
}

export async function getManagedActivities(): Promise<Array<ManagedActivity>> {
  try {
    const response = await fetch("/api/organizations/activities", { cache: "no-store" });
    return await readJson(response, activityListSchema);
  } catch (error: unknown) {
    if (error instanceof OrganizationActivitiesError) {
      throw error;
    }
    throw new OrganizationActivitiesError("Não foi possível conectar à gestão de atividades.");
  }
}

export async function updateParticipantAttendance(
  activityId: string,
  participantId: string,
  status: AttendanceStatus,
): Promise<ActivityParticipant> {
  try {
    const response = await fetch(
      `/api/organizations/activities/${encodeURIComponent(activityId)}/participants/${encodeURIComponent(participantId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      },
    );
    const result = await readJson(response, attendanceUpdateSchema);
    if (result.participant.id !== participantId) throw new OrganizationActivitiesError("O serviço retornou outro participante.");
    return result.participant;
  } catch (error: unknown) {
    if (error instanceof OrganizationActivitiesError) {
      throw error;
    }
    throw new OrganizationActivitiesError("Não foi possível atualizar a presença.");
  }
}

export async function updateParticipantsAttendance(activityId: string, participantIds: string[], status: AttendanceStatus) {
  const results = await Promise.allSettled(
    participantIds.map((id) => updateParticipantAttendance(activityId, id, status)),
  );
  const updated: ActivityParticipant[] = [];
  const failedIds: string[] = [];
  results.forEach((result, index) => {
    if (result.status === "fulfilled") updated.push(result.value);
    else {
      const id = participantIds[index];
      if (id !== undefined) failedIds.push(id);
    }
  });
  return { updated, failedIds };
}

export async function dispatchActivityCertificates(
  activityId: string,
): Promise<CertificateDispatchReceipt> {
  try {
    const response = await fetch(
      `/api/organizations/activities/${encodeURIComponent(activityId)}/certificates`,
      { method: "POST" },
    );
    return await readJson(response, certificateDispatchSchema);
  } catch (error: unknown) {
    if (error instanceof OrganizationActivitiesError) {
      throw error;
    }
    throw new OrganizationActivitiesError("Não foi possível conectar ao serviço de certificados.");
  }
}

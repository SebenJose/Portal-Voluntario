import { z } from "zod";

import { opportunityCategories } from "@/features/opportunities/types";

export const activitySessionSchema = z.object({
  date: z.iso.date(),
  startsAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/u),
  endsAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/u),
}).refine((session) => session.endsAt > session.startsAt, "O término deve ocorrer depois do início.");

export const opportunitySchema = z.object({
  id: z.string(),
  title: z.string(),
  organization: z.string(),
  description: z.string(),
  category: z.enum(opportunityCategories),
  format: z.enum(["Presencial", "Híbrido", "Online"]),
  location: z.string(),
  dateLabel: z.string(),
  durationLabel: z.string(),
  sessions: z.array(activitySessionSchema).min(1),
  hours: z.number(),
  vacancies: z.number().int().nonnegative(),
  enrolled: z.number().int().nonnegative(),
  featured: z.boolean().optional(),
});

export const opportunitiesResponseSchema = z.object({
  items: z.array(opportunitySchema),
  registeredIds: z.array(z.string()),
});

export const registrationResponseSchema = z.object({
  opportunityId: z.string(),
  registered: z.literal(true),
  enrolled: z.number().int().nonnegative(),
});

export const cancellationResponseSchema = registrationResponseSchema.extend({ registered: z.literal(false) });

export type OpportunitiesResponse = z.infer<typeof opportunitiesResponseSchema>;
export type RegistrationResponse = z.infer<typeof registrationResponseSchema>;
export type CancellationResponse = z.infer<typeof cancellationResponseSchema>;
export type ActivitySession = z.infer<typeof activitySessionSchema>;

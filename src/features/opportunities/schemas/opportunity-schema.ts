import { z } from "zod";

import { opportunityCategories } from "@/features/opportunities/types";

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

export type OpportunitiesResponse = z.infer<typeof opportunitiesResponseSchema>;
export type RegistrationResponse = z.infer<typeof registrationResponseSchema>;

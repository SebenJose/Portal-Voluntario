import { z } from "zod";

import { opportunitySchema } from "@/features/opportunities/schemas/opportunity-schema";
import { activityCategories } from "@/lib/activity-categories";

export const completedDemoActivitySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  organization: z.string().min(1),
  category: z.enum(activityCategories),
  hours: z.number().int().positive(),
  completedAt: z.iso.date(),
});

export const dashboardPresentationSchema = z.object({
  hoursSummary: z.array(z.object({
    category: z.enum(activityCategories),
    completed: z.number().int().nonnegative(),
  })),
  completedActivities: z.array(completedDemoActivitySchema),
  registeredActivities: z.array(opportunitySchema),
});

export type DashboardPresentation = z.infer<typeof dashboardPresentationSchema>;

import { z } from "zod";
import { activityCategories } from "@/lib/activity-categories";

export const dashboardSummarySchema = z.object({
  hoursSummary: z.array(z.object({ category: z.enum(activityCategories), completed: z.number().nonnegative() })),
  registrations: z.number().int().nonnegative(),
  upcomingActivities: z.array(z.object({ id: z.string(), title: z.string(), organization: z.string(), dateLabel: z.string(), status: z.string() })),
});

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;

import type { z } from "zod";
import type { opportunitySchema } from "@/features/opportunities/schemas/opportunity-schema";

export { activityCategories as opportunityCategories } from "@/lib/activity-categories";
export type { ActivityCategory as OpportunityCategory } from "@/lib/activity-categories";

export type Opportunity = z.infer<typeof opportunitySchema>;

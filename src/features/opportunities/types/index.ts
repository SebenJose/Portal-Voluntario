import type { z } from "zod";
import type { opportunitySchema } from "@/features/opportunities/schemas/opportunity-schema";

export const opportunityCategories = ["Ensino", "Pesquisa", "Extensão"] as const;

export type OpportunityCategory = (typeof opportunityCategories)[number];

export type Opportunity = z.infer<typeof opportunitySchema>;

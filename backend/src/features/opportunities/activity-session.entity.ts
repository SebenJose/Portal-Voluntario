import { EntitySchema } from "typeorm";
import type { Opportunity } from "@/features/opportunities/opportunity.entity";

export interface ActivitySession {
  id: string;
  opportunityId: string;
  date: string;
  startsAt: string;
  endsAt: string;
  opportunity?: Opportunity;
}

export const ActivitySessionEntity = new EntitySchema<ActivitySession>({
  name: "ActivitySession", tableName: "activity_sessions",
  columns: {
    id: { type: "uuid", primary: true, generated: "uuid" },
    opportunityId: { type: String },
    date: { type: String, length: 10 },
    startsAt: { type: String, length: 5 },
    endsAt: { type: String, length: 5 },
  },
  uniques: [{ columns: ["opportunityId", "date", "startsAt"] }],
  checks: [{ expression: `"endsAt" > "startsAt"` }],
  relations: { opportunity: { type: "many-to-one", target: "Opportunity", joinColumn: { name: "opportunityId" }, onDelete: "CASCADE", nullable: false } },
});

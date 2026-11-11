import { EntitySchema } from "typeorm";
import type { ActivityFormat, Category } from "@/common/domain";
import type { Organization } from "@/features/organizations/organization.entity";
import type { ActivitySession } from "@/features/opportunities/activity-session.entity";

export interface Opportunity {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  category: Category;
  format: ActivityFormat;
  location: string;
  dateLabel: string;
  durationLabel: string;
  hours: number;
  vacancies: number;
  featured: boolean;
  certificatesDispatched: boolean;
  organization?: Organization;
  sessions?: ActivitySession[];
}

export const OpportunityEntity = new EntitySchema<Opportunity>({
  name: "Opportunity", tableName: "opportunities",
  columns: {
    id: { type: String, primary: true },
    organizationId: { type: "uuid" },
    title: { type: String, length: 150 },
    description: { type: "text" },
    category: { type: String },
    format: { type: String },
    location: { type: String, length: 200 },
    dateLabel: { type: String, length: 200 },
    durationLabel: { type: String, length: 200 },
    hours: { type: "integer" },
    vacancies: { type: "integer" },
    featured: { type: Boolean, default: false },
    certificatesDispatched: { type: Boolean, default: false },
  },
  indices: [{ columns: ["organizationId"] }],
  checks: [
    { expression: `"category" IN ('Ensino', 'Pesquisa', 'Extensão')` },
    { expression: `"format" IN ('Presencial', 'Híbrido', 'Online')` },
    { expression: `"hours" > 0 AND "vacancies" > 0` },
  ],
  relations: {
    organization: { type: "many-to-one", target: "Organization", joinColumn: { name: "organizationId" }, onDelete: "RESTRICT", nullable: false },
    sessions: { type: "one-to-many", target: "ActivitySession", inverseSide: "opportunity" },
  },
});

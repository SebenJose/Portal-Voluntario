import { EntitySchema } from "typeorm";
import type { OrganizationStatus } from "@/common/domain";
import type { User } from "@/features/auth/user.entity";

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  status: OrganizationStatus;
  reviewedAt: Date | null;
  owner?: User;
}

export const OrganizationEntity = new EntitySchema<Organization>({
  name: "Organization", tableName: "organizations",
  columns: {
    id: { type: "uuid", primary: true, generated: "uuid" },
    name: { type: String, length: 150 },
    ownerId: { type: "uuid", unique: true },
    status: { type: String, default: "approved" },
    reviewedAt: { type: Date, nullable: true },
  },
  checks: [{ expression: `"status" IN ('pending', 'approved', 'rejected')` }],
  relations: { owner: { type: "many-to-one", target: "User", joinColumn: { name: "ownerId" }, nullable: false, onDelete: "RESTRICT" } },
});

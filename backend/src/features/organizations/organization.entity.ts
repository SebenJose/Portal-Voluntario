import { EntitySchema } from "typeorm";
import type { User } from "@/features/auth/user.entity";

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  owner?: User;
}

export const OrganizationEntity = new EntitySchema<Organization>({
  name: "Organization", tableName: "organizations",
  columns: {
    id: { type: "uuid", primary: true, generated: "uuid" },
    name: { type: String, length: 150 },
    ownerId: { type: "uuid", unique: true },
  },
  relations: { owner: { type: "many-to-one", target: "User", joinColumn: { name: "ownerId" }, nullable: false, onDelete: "RESTRICT" } },
});

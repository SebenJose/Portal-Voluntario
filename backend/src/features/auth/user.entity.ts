import { EntitySchema } from "typeorm";
import type { OrganizationStatus, Role } from "@/common/domain";
import type { Organization } from "@/features/organizations/organization.entity";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
}

export const UserEntity = new EntitySchema<User>({
  name: "User", tableName: "users",
  columns: {
    id: { type: "uuid", primary: true, generated: "uuid" },
    name: { type: String, length: 100 },
    email: { type: String, length: 254, unique: true, collation: "NOCASE" },
    passwordHash: { type: String, select: false },
    role: { type: String, default: "volunteer" },
    createdAt: { type: Date, createDate: true },
  },
  checks: [{ expression: `"role" IN ('volunteer', 'organization', 'admin')` }],
});

export interface PublicUser extends Pick<User, "id" | "name" | "email" | "role"> {
  organization?: { id: string; name: string; status: OrganizationStatus };
}

export function publicUser(user: User, organization?: Organization): PublicUser {
  const base = { id: user.id, name: user.name, email: user.email, role: user.role };
  return organization ? { ...base, organization: { id: organization.id, name: organization.name, status: organization.status } } : base;
}

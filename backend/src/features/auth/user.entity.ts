import { EntitySchema } from "typeorm";
import type { Role } from "@/common/domain";

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

export function publicUser(user: User): Pick<User, "id" | "name" | "email" | "role"> {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

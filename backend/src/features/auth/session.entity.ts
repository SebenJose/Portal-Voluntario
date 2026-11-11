import { EntitySchema } from "typeorm";
import type { User } from "@/features/auth/user.entity";

export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  user?: User;
}

export const SessionEntity = new EntitySchema<Session>({
  name: "Session", tableName: "sessions",
  columns: {
    id: { type: "uuid", primary: true, generated: "uuid" },
    userId: { type: "uuid" },
    expiresAt: { type: Date },
    createdAt: { type: Date, createDate: true },
  },
  indices: [{ columns: ["userId"] }, { columns: ["expiresAt"] }],
  relations: { user: { type: "many-to-one", target: "User", joinColumn: { name: "userId" }, onDelete: "CASCADE", nullable: false } },
});

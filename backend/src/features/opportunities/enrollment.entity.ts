import { EntitySchema } from "typeorm";
import type { Attendance } from "@/common/domain";
import type { User } from "@/features/auth/user.entity";
import type { Opportunity } from "@/features/opportunities/opportunity.entity";

export interface Enrollment {
  id: string;
  userId: string;
  opportunityId: string;
  status: Attendance;
  registeredAt: Date;
  user?: User;
  opportunity?: Opportunity;
}

export const EnrollmentEntity = new EntitySchema<Enrollment>({
  name: "Enrollment", tableName: "enrollments",
  columns: {
    id: { type: "uuid", primary: true, generated: "uuid" },
    userId: { type: "uuid" },
    opportunityId: { type: String },
    status: { type: String, default: "Inscrito" },
    registeredAt: { type: Date, createDate: true },
  },
  uniques: [{ columns: ["userId", "opportunityId"] }],
  indices: [{ columns: ["opportunityId"] }],
  checks: [{ expression: `"status" IN ('Inscrito', 'Presente', 'Ausente')` }],
  relations: {
    user: { type: "many-to-one", target: "User", joinColumn: { name: "userId" }, onDelete: "RESTRICT", nullable: false },
    opportunity: { type: "many-to-one", target: "Opportunity", joinColumn: { name: "opportunityId" }, onDelete: "RESTRICT", nullable: false },
  },
});

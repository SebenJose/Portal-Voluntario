import { EntitySchema } from "typeorm";
import type { Category } from "@/common/domain";
import type { Enrollment } from "@/features/opportunities/enrollment.entity";

export interface ParticipationCertificate {
  id: string;
  enrollmentId: string;
  category: Category;
  hours: number;
  createdAt: Date;
  enrollment?: Enrollment;
}

export const ParticipationCertificateEntity = new EntitySchema<ParticipationCertificate>({
  name: "ParticipationCertificate", tableName: "participation_certificates",
  columns: {
    id: { type: "uuid", primary: true, generated: "uuid" },
    enrollmentId: { type: "uuid", unique: true },
    category: { type: String },
    hours: { type: "integer" },
    createdAt: { type: Date, createDate: true },
  },
  checks: [
    { expression: `"hours" > 0` },
    { expression: `"category" IN ('Ensino', 'Pesquisa', 'Extensão')` },
  ],
  relations: { enrollment: { type: "many-to-one", target: "Enrollment", joinColumn: { name: "enrollmentId" }, onDelete: "RESTRICT", nullable: false } },
});

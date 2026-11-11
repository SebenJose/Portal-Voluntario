import { EntitySchema } from "typeorm";
import type { Category } from "@/common/domain";
import type { User } from "@/features/auth/user.entity";

export interface Submission {
  id: string;
  userId: string;
  title: string;
  category: Category;
  hours: number;
  description: string;
  status: "Em análise";
  createdAt: Date;
  documentName: string;
  documentType: string;
  documentSize: number;
  document: Buffer;
  user?: User;
}

export const SubmissionEntity = new EntitySchema<Submission>({
  name: "Submission", tableName: "submissions",
  columns: {
    id: { type: "uuid", primary: true, generated: "uuid" },
    userId: { type: "uuid" },
    title: { type: String, length: 150 },
    category: { type: String },
    hours: { type: "integer" },
    description: { type: "text" },
    status: { type: String, default: "Em análise" },
    createdAt: { type: Date, createDate: true },
    documentName: { type: String, length: 255 },
    documentType: { type: String },
    documentSize: { type: "integer" },
    document: { type: "blob", select: false },
  },
  indices: [{ columns: ["userId"] }],
  checks: [
    { expression: `"category" IN ('Ensino', 'Pesquisa', 'Extensão')` },
    { expression: `"status" = 'Em análise'` },
    { expression: `"hours" BETWEEN 1 AND 200` },
    { expression: `"documentType" IN ('application/pdf', 'image/jpeg', 'image/png')` },
    { expression: `"documentSize" BETWEEN 1 AND 5242880 AND length("document") = "documentSize"` },
  ],
  relations: { user: { type: "many-to-one", target: "User", joinColumn: { name: "userId" }, onDelete: "RESTRICT", nullable: false } },
});

import { z } from "zod";

export const roleSchema = z.enum(["volunteer", "organization", "admin"]);
export const categorySchema = z.enum(["Ensino", "Pesquisa", "Extensão"]);
export const formatSchema = z.enum(["Presencial", "Híbrido", "Online"]);
export const attendanceSchema = z.enum(["Inscrito", "Presente", "Ausente"]);
export const organizationStatusSchema = z.enum(["pending", "approved", "rejected"]);
export const submissionStatusSchema = z.enum(["Em análise", "Aprovado", "Recusado"]);
export type Role = z.infer<typeof roleSchema>;
export type Category = z.infer<typeof categorySchema>;
export type ActivityFormat = z.infer<typeof formatSchema>;
export type Attendance = z.infer<typeof attendanceSchema>;
export type OrganizationStatus = z.infer<typeof organizationStatusSchema>;
export type SubmissionStatus = z.infer<typeof submissionStatusSchema>;

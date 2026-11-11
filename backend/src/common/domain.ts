import { z } from "zod";

export const roleSchema = z.enum(["volunteer", "organization"]);
export const categorySchema = z.enum(["Ensino", "Pesquisa", "Extensão"]);
export const formatSchema = z.enum(["Presencial", "Híbrido", "Online"]);
export const attendanceSchema = z.enum(["Inscrito", "Presente", "Ausente"]);
export type Role = z.infer<typeof roleSchema>;
export type Category = z.infer<typeof categorySchema>;
export type ActivityFormat = z.infer<typeof formatSchema>;
export type Attendance = z.infer<typeof attendanceSchema>;

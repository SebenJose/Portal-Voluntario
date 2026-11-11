import { z } from "zod";

export const passwordSchema = z.string().min(1, "Informe sua senha.")
  .refine((value) => new TextEncoder().encode(value).length <= 72, "A senha deve ocupar até 72 bytes. Use uma senha menor.");

export const newPasswordSchema = passwordSchema.refine(
  (value) => Array.from(value).length >= 8,
  "A senha deve ter pelo menos 8 caracteres.",
);

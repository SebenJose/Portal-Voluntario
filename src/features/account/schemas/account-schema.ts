import { z } from "zod";

import { newPasswordSchema, passwordSchema } from "@/features/auth/schemas/password-schema";

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome com pelo menos 2 caracteres.").max(100, "Use até 100 caracteres para o nome."),
  organizationName: z.string().trim().max(150, "Use até 150 caracteres para o nome da organização."),
});

/** Para organizações, o nome da organização também é obrigatório. */
export const organizationProfileSchema = profileSchema.extend({
  organizationName: z.string().trim().min(2, "Informe o nome da organização com pelo menos 2 caracteres.").max(150, "Use até 150 caracteres para o nome da organização."),
});

export const passwordChangeSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: newPasswordSchema,
  newPasswordConfirmation: passwordSchema,
}).refine((values) => values.newPassword === values.newPasswordConfirmation, {
  message: "As senhas precisam ser iguais.",
  path: ["newPasswordConfirmation"],
});

export type ProfileValues = z.infer<typeof profileSchema>;
export type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;

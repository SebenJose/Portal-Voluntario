import { z } from "zod";
import { newPasswordSchema, passwordSchema } from "@/features/auth/schemas/password-schema";

export const registrationSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome com pelo menos 2 caracteres.").max(100, "Use até 100 caracteres para o nome."),
  email: z.string().trim().toLowerCase().pipe(z.email("Digite um e-mail válido.").max(254, "O e-mail é muito longo.")),
  password: newPasswordSchema,
  passwordConfirmation: passwordSchema,
}).refine((values) => values.password === values.passwordConfirmation, {
  message: "As senhas precisam ser iguais.",
  path: ["passwordConfirmation"],
});

export type RegistrationValues = z.infer<typeof registrationSchema>;

import { z } from "zod";
import { newPasswordSchema, passwordSchema } from "@/features/auth/schemas/password-schema";

const accountFields = {
  name: z.string().trim().min(2, "Informe seu nome com pelo menos 2 caracteres.").max(100, "Use até 100 caracteres para o nome."),
  email: z.string().trim().toLowerCase().pipe(z.email("Digite um e-mail válido.").max(254, "O e-mail é muito longo.")),
  password: newPasswordSchema,
  passwordConfirmation: passwordSchema,
};

const passwordsMatch = { message: "As senhas precisam ser iguais.", path: ["passwordConfirmation"] };

export const registrationSchema = z.object(accountFields)
  .refine((values) => values.password === values.passwordConfirmation, passwordsMatch);

export const organizationRegistrationSchema = z.object({
  ...accountFields,
  organizationName: z.string().trim().min(2, "Informe o nome da organização com pelo menos 2 caracteres.").max(150, "Use até 150 caracteres para o nome da organização."),
}).refine((values) => values.password === values.passwordConfirmation, passwordsMatch);

export type RegistrationValues = z.infer<typeof registrationSchema>;
export type OrganizationRegistrationValues = z.infer<typeof organizationRegistrationSchema>;

export const registrationProfiles = ["volunteer", "organization"] as const;

/** Formulário único de cadastro: o nome da organização só é exigido para o perfil organização. */
export const registrationFormSchema = z.object({
  ...accountFields,
  profile: z.enum(registrationProfiles),
  organizationName: z.string().trim().max(150, "Use até 150 caracteres para o nome da organização."),
}).superRefine((values, context) => {
  if (values.password !== values.passwordConfirmation) {
    context.addIssue({ code: "custom", path: ["passwordConfirmation"], message: passwordsMatch.message });
  }
  if (values.profile === "organization" && values.organizationName.length < 2) {
    context.addIssue({ code: "custom", path: ["organizationName"], message: "Informe o nome da organização com pelo menos 2 caracteres." });
  }
});

export type RegistrationFormInput = z.input<typeof registrationFormSchema>;
export type RegistrationFormValues = z.infer<typeof registrationFormSchema>;
export type RegistrationProfile = RegistrationFormValues["profile"];

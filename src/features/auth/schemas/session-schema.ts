import { z } from "zod";
import { passwordSchema } from "@/features/auth/schemas/password-schema";

export const authUserSchema = z.object({
  id: z.string().min(1),
  email: z.email(),
  name: z.string().min(1),
  role: z.enum(["volunteer", "organization"]),
});

export const sessionPayloadSchema = z.object({
  sessionId: z.uuid(),
  issuedAt: z.number().int().positive(),
  expiresAt: z.number().int().positive(),
});

export const loginRequestSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Digite um e-mail válido.").max(254, "O e-mail é muito longo.")),
  password: passwordSchema,
});

export type AuthUser = z.infer<typeof authUserSchema>;
export type SessionPayload = z.infer<typeof sessionPayloadSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;

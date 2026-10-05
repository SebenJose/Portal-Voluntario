import { z } from "zod";

export const authUserSchema = z.object({
  id: z.string().min(1),
  email: z.email(),
  name: z.string().min(1),
  role: z.enum(["volunteer", "organization"]),
});

export const sessionPayloadSchema = z.object({
  user: authUserSchema,
  issuedAt: z.number().int().positive(),
  expiresAt: z.number().int().positive(),
});

export const loginRequestSchema = z.object({
  email: z.email("Digite um e-mail válido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

export type AuthUser = z.infer<typeof authUserSchema>;
export type SessionPayload = z.infer<typeof sessionPayloadSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;

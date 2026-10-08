import { z } from "zod";

import { authUserSchema, loginRequestSchema, type LoginRequest } from "@/features/auth/schemas/session-schema";
import { registrationSchema, type RegistrationValues } from "@/features/auth/schemas/registration-schema";

const authResponseSchema = z.object({ user: authUserSchema });
const errorResponseSchema = z.object({ error: z.string().min(1) });

export class AuthServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthServiceError";
  }
}

export async function login(credentials: LoginRequest) {
  const validatedCredentials = loginRequestSchema.parse(credentials);
  const result = await submitAuth("/api/auth/login", validatedCredentials, authResponseSchema);
  return result.user;
}

export async function registerAccount(values: RegistrationValues) {
  return submitAuth("/api/auth/register", registrationSchema.parse(values), z.object({ message: z.string().min(1) }));
}

async function submitAuth<T>(url: string, values: LoginRequest | RegistrationValues, schema: z.ZodType<T>): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
  } catch {
    throw new AuthServiceError("Não foi possível conectar. Verifique sua internet e tente novamente.");
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = errorResponseSchema.safeParse(body);
    throw new AuthServiceError(error.success ? error.data.error : "Não foi possível concluir a solicitação. Tente novamente.");
  }
  const parsedBody = schema.safeParse(body);
  if (!parsedBody.success) throw new AuthServiceError("A resposta do serviço de acesso é inválida.");
  return parsedBody.data;
}

export async function getCurrentUser() {
  let response: Response;
  try {
    response = await fetch("/api/auth/session", { cache: "no-store" });
  } catch {
    throw new AuthServiceError("Não foi possível verificar a sessão.");
  }
  if (response.status === 401) return null;
  if (!response.ok) throw new AuthServiceError("Não foi possível verificar a sessão.");
  const body: unknown = await response.json().catch(() => null);
  const parsedBody = authResponseSchema.safeParse(body);
  if (!parsedBody.success) throw new AuthServiceError("A resposta do serviço de acesso é inválida.");
  return parsedBody.data.user;
}

export async function logout() {
  let response: Response;
  try {
    response = await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    throw new AuthServiceError("Não foi possível encerrar a sessão. Tente novamente.");
  }
  if (!response.ok) throw new AuthServiceError("Não foi possível encerrar a sessão. Tente novamente.");
}

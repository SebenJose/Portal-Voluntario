import { z } from "zod";

import { passwordChangeSchema, type PasswordChangeValues } from "@/features/account/schemas/account-schema";
import { authUserSchema, type AuthUser } from "@/features/auth/schemas/session-schema";

export class AccountServiceError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "AccountServiceError";
  }
}

async function patch(path: string, body: unknown): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(path, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    throw new AccountServiceError("Não foi possível conectar. Verifique sua internet e tente novamente.");
  }
  if (!response.ok) {
    const error = z.object({ message: z.string().min(1) }).safeParse(await response.json().catch(() => null));
    throw new AccountServiceError(error.success ? error.data.message : "Não foi possível salvar as alterações.", response.status);
  }
  return response;
}

export async function updateProfile(values: { name: string; organizationName?: string }): Promise<AuthUser> {
  const response = await patch("/api/account/profile", values);
  const parsed = z.object({ user: authUserSchema }).safeParse(await response.json().catch(() => null));
  if (!parsed.success) throw new AccountServiceError("O serviço retornou um perfil inválido.");
  return parsed.data.user;
}

export async function changePassword(values: PasswordChangeValues): Promise<void> {
  await patch("/api/account/password", passwordChangeSchema.parse(values));
}

import { HttpResponse } from "msw";
import { getCurrentUser } from "@/features/auth/services/client-auth";
import type { AuthUser } from "@/features/auth/schemas/session-schema";

export async function requireMockOrganization(): Promise<AuthUser | Response> {
  try {
    const user = await getCurrentUser();
    if (!user) return HttpResponse.json({ message: "Entre na sua conta." }, { status: 401 });
    if (user.role !== "organization") return HttpResponse.json({ message: "Acesso reservado a organizações." }, { status: 403 });
    return user;
  } catch {
    return HttpResponse.json({ message: "Não foi possível verificar o acesso." }, { status: 503 });
  }
}

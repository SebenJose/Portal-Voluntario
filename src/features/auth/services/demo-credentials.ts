import type { LoginRequest, AuthUser } from "@/features/auth/schemas/session-schema";

const demoCredential = {
  email: "rh@portalvoluntario.dev",
  password: "Voluntario2026!",
  user: {
    id: "demo-voluntario-001",
    email: "rh@portalvoluntario.dev",
    name: "João Seben",
    role: "volunteer",
  } satisfies AuthUser,
};

export function authenticateDemoUser(credentials: LoginRequest): AuthUser | null {
  if (
    credentials.email.trim().toLocaleLowerCase("pt-BR") !== demoCredential.email ||
    credentials.password !== demoCredential.password
  ) {
    return null;
  }
  return demoCredential.user;
}

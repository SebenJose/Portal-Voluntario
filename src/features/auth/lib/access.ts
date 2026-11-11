import type { AuthUser, UserRole } from "@/features/auth/schemas/session-schema";

/** Telas privadas e os papéis que podem acessá-las. A API repete a regra com 403. */
export const protectedRoutes = [
  { prefix: "/painel", roles: ["volunteer", "organization"] },
  { prefix: "/minhas-atividades", roles: ["volunteer"] },
  { prefix: "/certificados", roles: ["volunteer"] },
  { prefix: "/organizacao", roles: ["organization"] },
  { prefix: "/administracao", roles: ["admin"] },
  { prefix: "/conta", roles: ["volunteer", "organization", "admin"] },
] as const satisfies ReadonlyArray<{ prefix: string; roles: ReadonlyArray<UserRole> }>;

export const protectedPrefixes = protectedRoutes.map((route) => route.prefix);

function matches(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isProtectedPath(pathname: string): boolean {
  return protectedRoutes.some((route) => matches(pathname, route.prefix));
}

export function canAccessPath(pathname: string, role: UserRole): boolean {
  const route = protectedRoutes.find((item) => matches(pathname, item.prefix));
  return !route || route.roles.some((allowed) => allowed === role);
}

/** Tela inicial de cada papel, usada após o login e quando o acesso é negado. */
export function homePathFor(role: UserRole): string {
  return role === "admin" ? "/administracao" : "/painel";
}

export function isApprovedOrganization(user: AuthUser): boolean {
  return user.role === "organization" && user.organization?.status === "approved";
}

export const roleLabels: Record<UserRole, string> = {
  volunteer: "Voluntário",
  organization: "Organização",
  admin: "Administração",
};

import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { canAccessPath, homePathFor } from "@/features/auth/lib/access";
import type { AuthUser } from "@/features/auth/schemas/session-schema";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/features/auth/services/session";

export async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}

export async function requireAuthenticatedUser(nextPath: string) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect(`/entrar?next=${encodeURIComponent(nextPath)}`);
  }

  return user;
}

/** Exige sessão e um papel autorizado para a tela; outros papéis voltam à própria tela inicial. */
export async function requirePageAccess(pathname: string, nextPath = pathname): Promise<AuthUser> {
  const user = await requireAuthenticatedUser(nextPath);
  if (!canAccessPath(pathname, user.role)) redirect(homePathFor(user.role));
  return user;
}

export async function requireOrganizationUser() {
  return requirePageAccess("/organizacao");
}

import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { SESSION_COOKIE_NAME, verifySessionToken } from "@/features/auth/services/session";

export async function requireAuthenticatedUser(nextPath: string) {
  const cookieStore = await cookies();
  const user = await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (!user) {
    redirect(`/entrar?next=${encodeURIComponent(nextPath)}`);
  }

  return user;
}

export async function requireOrganizationUser() {
  const user = await requireAuthenticatedUser("/organizacao");
  if (user.role !== "organization") redirect("/painel");
  return user;
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginPage } from "@/features/auth";
import { getSafeRedirectPath } from "@/features/auth/services/safe-redirect";
import { getAuthenticatedUser } from "@/features/auth/services/server-session";

export const metadata: Metadata = { title: "Entrar | Portal Voluntário" };

type PageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function Page({ searchParams }: PageProps) {
  const { next } = await searchParams;
  const destination = getSafeRedirectPath(next);
  if (await getAuthenticatedUser()) redirect(destination);
  return <LoginPage nextPath={destination} />;
}

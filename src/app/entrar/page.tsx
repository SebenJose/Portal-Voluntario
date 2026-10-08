import type { Metadata } from "next";

import { LoginPage } from "@/features/auth";
import { getSafeRedirectPath } from "@/features/auth/services/safe-redirect";

export const metadata: Metadata = { title: "Entrar | Portal Voluntário" };

type PageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function Page({ searchParams }: PageProps) {
  const { next } = await searchParams;
  return <LoginPage nextPath={getSafeRedirectPath(next)} />;
}

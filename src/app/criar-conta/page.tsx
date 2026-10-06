import type { Metadata } from "next";

import { AuthPageLayout } from "@/features/auth/components/auth-page-layout";
import { RegistrationForm } from "@/features/auth/components/registration-form";
import { getSafeRedirectPath } from "@/features/auth/services/safe-redirect";

export const metadata: Metadata = { title: "Criar conta | Portal Voluntário" };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await searchParams;
  return (
    <AuthPageLayout titleId="registration-title">
      <RegistrationForm nextPath={getSafeRedirectPath(next)} />
    </AuthPageLayout>
  );
}

import { LoginPage } from "@/features/auth";
import { getSafeRedirectPath } from "@/features/auth/services/safe-redirect";

type PageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function Page({ searchParams }: PageProps) {
  const { next } = await searchParams;
  return <LoginPage nextPath={getSafeRedirectPath(next)} />;
}

import { AuthPageLayout } from "@/features/auth/components/auth-page-layout";
import { LoginForm } from "@/features/auth/components/login-form";

export function LoginPage({ nextPath }: { nextPath?: string }) {
  return (
    <AuthPageLayout titleId="login-title">
      <LoginForm nextPath={nextPath} />
    </AuthPageLayout>
  );
}

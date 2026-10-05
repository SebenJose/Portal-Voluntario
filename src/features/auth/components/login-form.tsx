"use client";

import { useRouter } from "next/navigation";
import { type SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthServiceError, login } from "@/features/auth/services/client-auth";
import { getSafeRedirectPath } from "@/features/auth/services/safe-redirect";

import { loginSchema, type LoginFormValues } from "../schemas/login-schema";

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const destination = getSafeRedirectPath(nextPath);
  const form = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(loginSchema),
  });

  const handleLogin: SubmitHandler<LoginFormValues> = async (values) => {
    form.clearErrors("root.server");
    try {
      await login(values);
      router.replace(destination);
      router.refresh();
    } catch (error: unknown) {
      form.setError("root.server", {
        type: "server",
        message: error instanceof AuthServiceError
          ? error.message
          : "Não foi possível entrar. Tente novamente.",
      });
    }
  };

  return (
    <Card className="border-brand-yellow/30 bg-white shadow-xl shadow-brand-black/5">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Bem-vindo de volta</CardTitle>
        <CardDescription>Entre para acompanhar sua jornada de impacto.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" noValidate onSubmit={form.handleSubmit(handleLogin)}>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              aria-describedby={form.formState.errors.email ? "email-error" : undefined}
              aria-invalid={Boolean(form.formState.errors.email)}
              id="email"
              autoComplete="username"
              type="email"
              {...form.register("email")}
            />
            {form.formState.errors.email ? (
              <p className="text-sm text-destructive" id="email-error">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="password">Senha</Label>
              <span className="text-xs text-muted-foreground">Conta de demonstração</span>
            </div>
            <Input
              aria-describedby={form.formState.errors.password ? "password-error" : undefined}
              aria-invalid={Boolean(form.formState.errors.password)}
              id="password"
              autoComplete="current-password"
              type="password"
              {...form.register("password")}
            />
            {form.formState.errors.password ? (
              <p className="text-sm text-destructive" id="password-error">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>

          <Button aria-busy={form.formState.isSubmitting} className="w-full bg-brand-yellow font-semibold text-brand-black hover:bg-brand-yellow/85" disabled={form.formState.isSubmitting} type="submit">
            {form.formState.isSubmitting ? "Entrando…" : form.formState.errors.root?.server ? "Tentar novamente" : "Entrar no portal"}
          </Button>

          {form.formState.errors.root?.server ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
              {form.formState.errors.root.server.message}
            </p>
          ) : null}
        </form>

        <p className="mt-6 rounded-lg border border-brand-yellow/50 bg-brand-yellow/10 px-3 py-2 text-sm text-brand-black">
          Demonstração: <span className="font-semibold">rh@portalvoluntario.dev</span> / <span className="font-semibold">Voluntario2026!</span>
        </p>
      </CardContent>
    </Card>
  );
}

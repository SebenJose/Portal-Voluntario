"use client";

import Link from "next/link";
import { useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AuthField } from "@/features/auth/components/auth-field";
import { AuthServiceError, login } from "@/features/auth/services/client-auth";
import { getSafeRedirectPath } from "@/features/auth/services/safe-redirect";

import { loginSchema, type LoginFormValues } from "@/features/auth/schemas/login-schema";

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const destination = getSafeRedirectPath(nextPath);
  const form = useForm<LoginFormValues>({
    mode: "onTouched",
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(loginSchema),
  });
  const isLoggingIn = form.formState.isSubmitting || isRedirecting;

  const handleLogin: SubmitHandler<LoginFormValues> = async (values) => {
    form.clearErrors("root.server");
    try {
      await login(values);
      setIsRedirecting(true);
      // Recarrega o destino com o cookie da sessão, sem reutilizar rotas pré-autenticação.
      window.location.replace(destination);
    } catch (error: unknown) {
      setIsRedirecting(false);
      form.setError("root.server", {
        type: "server",
        message: error instanceof AuthServiceError
          ? error.message
          : "Não foi possível entrar. Tente novamente.",
      });
    }
  };

  return (
    <Card className="gap-8 overflow-visible rounded-2xl bg-white py-8 shadow-xl shadow-brand-black/5 ring-1 ring-brand-black/5 sm:py-10">
      <CardHeader className="gap-3 px-6 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Seu espaço no portal
        </p>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-brand-black sm:text-[2rem]" id="login-title">
          Bem-vindo de volta.
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Entre na sua conta e continue sua jornada de impacto.
        </p>
      </CardHeader>
      <CardContent className="px-6 sm:px-8">
        <form aria-busy={isLoggingIn} className="space-y-6" noValidate onSubmit={form.handleSubmit(handleLogin)}>
          <AuthField
            autoCapitalize="none"
            autoComplete="username"
            disabled={isLoggingIn}
            error={form.formState.errors.email?.message}
            icon={Mail}
            id="email"
            label="E-mail"
            placeholder="voce@exemplo.com"
            spellCheck={false}
            type="email"
            {...form.register("email")}
          />
          <AuthField
            autoComplete="current-password"
            disabled={isLoggingIn}
            error={form.formState.errors.password?.message}
            icon={LockKeyhole}
            id="password"
            label="Senha"
            placeholder="Digite sua senha"
            type="password"
            {...form.register("password")}
          />

          <Button aria-busy={isLoggingIn} className="h-13 w-full justify-between rounded-xl bg-brand-yellow px-5 text-sm font-semibold text-brand-black hover:bg-brand-yellow/85" disabled={isLoggingIn} type="submit">
            {isRedirecting ? "Abrindo o portal…" : isLoggingIn ? "Entrando…" : form.formState.errors.root?.server ? "Tentar novamente" : "Entrar no portal"}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>

          {form.formState.errors.root?.server ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
              {form.formState.errors.root.server.message}
            </p>
          ) : null}
        </form>

        <p className="mt-7 border-t border-border pt-6 text-center text-sm leading-6 text-muted-foreground">
          Ainda não tem uma conta?{" "}
          <Link className="rounded-sm font-semibold text-brand-black underline decoration-brand-yellow decoration-2 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring" href={`/criar-conta?next=${encodeURIComponent(destination)}`}>
            Crie sua conta
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

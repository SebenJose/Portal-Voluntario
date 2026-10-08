"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { type SubmitHandler, useForm } from "react-hook-form";
import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AuthField } from "@/features/auth/components/auth-field";
import { registrationSchema, type RegistrationValues } from "@/features/auth/schemas/registration-schema";
import { AuthServiceError, registerAccount } from "@/features/auth/services/client-auth";
import { getSafeRedirectPath } from "@/features/auth/services/safe-redirect";

export function RegistrationForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const destination = getSafeRedirectPath(nextPath);
  const form = useForm<RegistrationValues>({
    mode: "onTouched",
    defaultValues: { name: "", email: "", password: "", passwordConfirmation: "" },
    resolver: zodResolver(registrationSchema),
  });

  const handleRegister: SubmitHandler<RegistrationValues> = async (values) => {
    form.clearErrors("root.server");
    try {
      await registerAccount(values);
      router.replace(destination);
      router.refresh();
    } catch (error: unknown) {
      form.setError("root.server", {
        type: "server",
        message: error instanceof AuthServiceError ? error.message : "Não foi possível criar sua conta. Tente novamente.",
      });
    }
  };

  return (
    <Card className="gap-6 overflow-visible rounded-2xl bg-white py-8 shadow-xl shadow-brand-black/5 ring-1 ring-brand-black/5 sm:py-10">
      <CardHeader className="gap-3 px-6 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Sua jornada começa aqui</p>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-brand-black sm:text-[2rem]" id="registration-title">Crie sua conta.</h1>
        <p className="text-sm leading-6 text-muted-foreground">Faça parte da comunidade e encontre sua próxima causa.</p>
      </CardHeader>
      <CardContent className="px-6 sm:px-8">
        <form aria-busy={form.formState.isSubmitting} className="space-y-5" noValidate onSubmit={form.handleSubmit(handleRegister)}>
          <AuthField
            autoComplete="name"
            disabled={form.formState.isSubmitting}
            error={form.formState.errors.name?.message}
            icon={UserRound}
            id="name"
            label="Nome completo"
            placeholder="Como você se chama?"
            {...form.register("name")}
          />
          <AuthField
            autoCapitalize="none"
            autoComplete="username"
            disabled={form.formState.isSubmitting}
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
            autoComplete="new-password"
            disabled={form.formState.isSubmitting}
            error={form.formState.errors.password?.message}
            icon={LockKeyhole}
            id="password"
            label="Senha"
            placeholder="Pelo menos 8 caracteres"
            type="password"
            {...form.register("password", { deps: ["passwordConfirmation"] })}
          />
          <AuthField
            autoComplete="new-password"
            disabled={form.formState.isSubmitting}
            error={form.formState.errors.passwordConfirmation?.message}
            icon={LockKeyhole}
            id="passwordConfirmation"
            label="Confirmar senha"
            placeholder="Digite a senha novamente"
            type="password"
            {...form.register("passwordConfirmation")}
          />
          <Button aria-busy={form.formState.isSubmitting} className="h-13 w-full justify-between rounded-xl bg-brand-yellow px-5 font-semibold text-brand-black hover:bg-brand-yellow/85" disabled={form.formState.isSubmitting} type="submit">
            {form.formState.isSubmitting ? "Criando sua conta…" : form.formState.errors.root?.server ? "Tentar novamente" : "Criar minha conta"}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
          {form.formState.errors.root?.server ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">{form.formState.errors.root.server.message}</p>
          ) : null}
        </form>
        <p className="mt-7 border-t border-border pt-6 text-center text-sm leading-6 text-muted-foreground">
          Já tem uma conta?{" "}
          <Link className="rounded-sm font-semibold text-brand-black underline decoration-brand-yellow decoration-2 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring" href={`/entrar?next=${encodeURIComponent(destination)}`}>Entre no portal</Link>
        </p>
      </CardContent>
    </Card>
  );
}

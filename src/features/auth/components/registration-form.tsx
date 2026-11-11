"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { type SubmitHandler, useForm, useWatch } from "react-hook-form";
import { ArrowRight, Building2, HandHeart, LockKeyhole, Mail, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AuthField } from "@/features/auth/components/auth-field";
import { registrationFormSchema, type RegistrationFormInput, type RegistrationFormValues, type RegistrationProfile } from "@/features/auth/schemas/registration-schema";
import { AuthServiceError, registerAccount, registerOrganization } from "@/features/auth/services/client-auth";
import { getSafeRedirectPath } from "@/features/auth/services/safe-redirect";
import { cn } from "@/lib/utils";

const profileOptions: Array<{ value: RegistrationProfile; label: string; description: string; icon: typeof HandHeart }> = [
  { value: "volunteer", label: "Sou voluntário", description: "Participe de atividades e acompanhe suas horas.", icon: HandHeart },
  { value: "organization", label: "Sou uma organização", description: "Publique atividades após aprovação da administração.", icon: Building2 },
];

export function RegistrationForm({ nextPath, initialProfile = "volunteer" }: { nextPath?: string; initialProfile?: RegistrationProfile }) {
  const [message, setMessage] = useState<string | null>(null);
  const destination = getSafeRedirectPath(nextPath);
  const form = useForm<RegistrationFormInput, unknown, RegistrationFormValues>({
    mode: "onTouched",
    defaultValues: { profile: initialProfile, name: "", email: "", password: "", passwordConfirmation: "", organizationName: "" },
    resolver: zodResolver(registrationFormSchema),
  });
  const profile = useWatch({ control: form.control, name: "profile" });
  const isOrganization = profile === "organization";
  const disabled = !form.formState.isReady || form.formState.isSubmitting;

  const handleRegister: SubmitHandler<RegistrationFormValues> = async ({ profile: selected, organizationName, ...account }) => {
    form.clearErrors("root.server");
    try {
      const result = selected === "organization"
        ? await registerOrganization({ ...account, organizationName })
        : await registerAccount(account);
      setMessage(result.message);
      form.reset({ profile: selected, name: "", email: "", password: "", passwordConfirmation: "", organizationName: "" });
    } catch (error: unknown) {
      form.setError("root.server", {
        type: "server",
        message: error instanceof AuthServiceError ? error.message : "Não foi possível concluir o cadastro. Tente novamente.",
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
        {message ? (
          <div className="space-y-4" role="status">
            <p>{message}</p>
            <Button nativeButton={false} render={<Link href={`/entrar?next=${encodeURIComponent(destination)}`} />}>Entrar no portal</Button>
          </div>
        ) : <form aria-busy={form.formState.isSubmitting} className="space-y-5" noValidate onSubmit={form.handleSubmit(handleRegister)}>
          <fieldset className="space-y-2.5" disabled={disabled}>
            <legend className="mb-2.5 text-sm font-medium">Como você vai usar o portal?</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {profileOptions.map((option) => {
                const Icon = option.icon;
                const selected = profile === option.value;
                return (
                  <label
                    className={cn(
                      "flex cursor-pointer gap-3 rounded-xl border p-3 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
                      selected ? "border-brand-black bg-brand-yellow/15" : "border-border hover:bg-muted/50",
                    )}
                    key={option.value}
                  >
                    <input className="sr-only" type="radio" value={option.value} {...form.register("profile")} />
                    <Icon aria-hidden="true" className="mt-0.5 size-4.5 shrink-0" />
                    <span><span className="block font-semibold text-brand-black">{option.label}</span><span className="text-muted-foreground">{option.description}</span></span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          {isOrganization ? (
            <AuthField
              autoComplete="organization"
              disabled={disabled}
              error={form.formState.errors.organizationName?.message}
              icon={Building2}
              id="organizationName"
              label="Nome da organização"
              placeholder="Como sua organização é conhecida?"
              {...form.register("organizationName")}
            />
          ) : null}
          <AuthField
            autoComplete="name"
            disabled={disabled}
            error={form.formState.errors.name?.message}
            icon={UserRound}
            id="name"
            label={isOrganization ? "Nome do responsável" : "Nome completo"}
            placeholder={isOrganization ? "Quem responde pela organização?" : "Como você se chama?"}
            {...form.register("name")}
          />
          <AuthField
            autoCapitalize="none"
            autoComplete="username"
            disabled={disabled}
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
            disabled={disabled}
            error={form.formState.errors.password?.message}
            icon={LockKeyhole}
            id="password"
            label="Senha"
            placeholder="Pelo menos 8 caracteres"
            type="password"
            {...form.register("password")}
          />
          <AuthField
            autoComplete="new-password"
            disabled={disabled}
            error={form.formState.errors.passwordConfirmation?.message}
            icon={LockKeyhole}
            id="passwordConfirmation"
            label="Confirmar senha"
            placeholder="Digite a senha novamente"
            type="password"
            {...form.register("passwordConfirmation")}
          />
          {isOrganization ? (
            <p className="rounded-lg border border-brand-yellow/50 bg-brand-yellow/10 px-3 py-2 text-sm leading-6">
              O cadastro de organizações passa pela aprovação da administração. Você já pode entrar para acompanhar a análise.
            </p>
          ) : null}
          <Button aria-busy={form.formState.isSubmitting} className="h-13 w-full justify-between rounded-xl bg-brand-yellow px-5 font-semibold text-brand-black hover:bg-brand-yellow/85" disabled={disabled} type="submit">
            {form.formState.isSubmitting ? "Enviando cadastro…" : form.formState.errors.root?.server ? "Tentar novamente" : isOrganization ? "Cadastrar organização" : "Criar minha conta"}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
          {form.formState.errors.root?.server ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">{form.formState.errors.root.server.message}</p>
          ) : null}
        </form>}
        <p className="mt-7 border-t border-border pt-6 text-center text-sm leading-6 text-muted-foreground">
          Já tem uma conta?{" "}
          <Link className="rounded-sm font-semibold text-brand-black underline decoration-brand-yellow decoration-2 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring" href={`/entrar?next=${encodeURIComponent(destination)}`}>Entre no portal</Link>
        </p>
      </CardContent>
    </Card>
  );
}

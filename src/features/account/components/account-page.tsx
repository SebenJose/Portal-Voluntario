"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Building2, KeyRound, LockKeyhole, UserRound } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { organizationProfileSchema, passwordChangeSchema, profileSchema, type PasswordChangeValues, type ProfileValues } from "@/features/account/schemas/account-schema";
import { AccountServiceError, changePassword, updateProfile } from "@/features/account/services/account";
import { AuthField } from "@/features/auth/components/auth-field";
import { roleLabels } from "@/features/auth/lib/access";
import type { AuthUser } from "@/features/auth/schemas/session-schema";

function errorMessage(cause: unknown, fallback: string): string {
  return cause instanceof AccountServiceError ? cause.message : fallback;
}

function ProfileForm({ user }: { user: AuthUser }) {
  const router = useRouter();
  const isOrganization = user.role === "organization";
  const [notice, setNotice] = useState<string | null>(null);
  const form = useForm<ProfileValues>({
    resolver: zodResolver(isOrganization ? organizationProfileSchema : profileSchema),
    defaultValues: { name: user.name, organizationName: user.organization?.name ?? "" },
  });
  const busy = form.formState.isSubmitting;

  async function submit(values: ProfileValues): Promise<void> {
    setNotice(null);
    form.clearErrors("root.server");
    try {
      const updated = await updateProfile(isOrganization ? values : { name: values.name });
      form.reset({ name: updated.name, organizationName: updated.organization?.name ?? "" });
      setNotice("Perfil atualizado.");
      router.refresh();
    } catch (cause: unknown) {
      form.setError("root.server", { type: "server", message: errorMessage(cause, "Não foi possível atualizar o perfil.") });
    }
  }

  return (
    <Card aria-labelledby="profile-title" as="section">
      <CardHeader><CardTitle id="profile-title">Dados do perfil</CardTitle><p className="text-sm text-muted-foreground">{roleLabels[user.role]} · {user.email}</p></CardHeader>
      <CardContent>
        <form aria-busy={busy} className="space-y-5" noValidate onSubmit={form.handleSubmit(submit)}>
          <AuthField autoComplete="name" disabled={busy} error={form.formState.errors.name?.message} icon={UserRound} id="profile-name" label={isOrganization ? "Nome do responsável" : "Nome completo"} {...form.register("name")} />
          {isOrganization ? (
            <AuthField autoComplete="organization" disabled={busy} error={form.formState.errors.organizationName?.message} icon={Building2} id="profile-organization" label="Nome da organização" {...form.register("organizationName")} />
          ) : null}
          <Button aria-busy={busy} disabled={busy} type="submit">{busy ? "Salvando..." : "Salvar perfil"}</Button>
          {notice ? <p className="text-sm text-emerald-900" role="status">{notice}</p> : null}
          {form.formState.errors.root?.server ? <p className="text-sm text-destructive" role="alert">{form.formState.errors.root.server.message}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordForm() {
  const [notice, setNotice] = useState<string | null>(null);
  const form = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: "", newPassword: "", newPasswordConfirmation: "" },
  });
  const busy = form.formState.isSubmitting;

  async function submit(values: PasswordChangeValues): Promise<void> {
    setNotice(null);
    form.clearErrors("root.server");
    try {
      await changePassword(values);
      form.reset();
      setNotice("Senha alterada. As outras sessões da conta foram encerradas.");
    } catch (cause: unknown) {
      form.setError("root.server", { type: "server", message: errorMessage(cause, "Não foi possível trocar a senha.") });
    }
  }

  return (
    <Card aria-labelledby="password-title" as="section">
      <CardHeader><CardTitle id="password-title">Trocar senha</CardTitle><p className="text-sm text-muted-foreground">Ao trocar a senha, os outros dispositivos precisarão entrar novamente.</p></CardHeader>
      <CardContent>
        <form aria-busy={busy} className="space-y-5" noValidate onSubmit={form.handleSubmit(submit)}>
          <AuthField autoComplete="current-password" disabled={busy} error={form.formState.errors.currentPassword?.message} icon={LockKeyhole} id="current-password" label="Senha atual" type="password" {...form.register("currentPassword")} />
          <AuthField autoComplete="new-password" disabled={busy} error={form.formState.errors.newPassword?.message} icon={KeyRound} id="new-password" label="Nova senha" placeholder="Pelo menos 8 caracteres" type="password" {...form.register("newPassword")} />
          <AuthField autoComplete="new-password" disabled={busy} error={form.formState.errors.newPasswordConfirmation?.message} icon={KeyRound} id="new-password-confirmation" label="Confirmar nova senha" type="password" {...form.register("newPasswordConfirmation")} />
          <Button aria-busy={busy} disabled={busy} type="submit">{busy ? "Alterando..." : "Alterar senha"}</Button>
          {notice ? <p className="text-sm text-emerald-900" role="status">{notice}</p> : null}
          {form.formState.errors.root?.server ? <p className="text-sm text-destructive" role="alert">{form.formState.errors.root.server.message}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}

export function AccountPage({ user }: { user: AuthUser }) {
  return (
    <AppShell active="account" description="Atualize seus dados e sua senha de acesso." title="Minha conta" user={user}>
      <div className="grid max-w-5xl items-start gap-5 lg:grid-cols-2">
        <ProfileForm user={user} />
        <PasswordForm />
      </div>
    </AppShell>
  );
}

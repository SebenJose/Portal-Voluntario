"use client";

import Link from "next/link";
import { useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { loginSchema, type LoginFormValues } from "../schemas/login-schema";

export function LoginForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const form = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(loginSchema),
  });

  const handleLogin: SubmitHandler<LoginFormValues> = () => {
    setIsSubmitted(true);
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
            <Label htmlFor="email">E-mail institucional</Label>
            <Input
              aria-describedby={form.formState.errors.email ? "email-error" : undefined}
              aria-invalid={Boolean(form.formState.errors.email)}
              id="email"
              placeholder="voce@utfpr.edu.br"
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
              <Link className="text-xs font-semibold text-brand-black underline decoration-brand-yellow decoration-2 underline-offset-4 hover:text-brand-black/70" href="#recuperar-senha">
                Esqueci minha senha
              </Link>
            </div>
            <Input
              aria-describedby={form.formState.errors.password ? "password-error" : undefined}
              aria-invalid={Boolean(form.formState.errors.password)}
              id="password"
              placeholder="••••••••"
              type="password"
              {...form.register("password")}
            />
            {form.formState.errors.password ? (
              <p className="text-sm text-destructive" id="password-error">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>

          <Button className="w-full bg-brand-yellow font-semibold text-brand-black hover:bg-brand-yellow/85" disabled={form.formState.isSubmitting} type="submit">
            Entrar no portal
          </Button>

          {isSubmitted ? (
            <p className="rounded-lg border border-brand-yellow/50 bg-brand-yellow/15 px-3 py-2 text-sm text-brand-black" role="status">
              Demonstração validada. O fluxo de autenticação será conectado posteriormente.
            </p>
          ) : null}
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Ainda não possui uma conta?{" "}
          <Link className="font-semibold text-brand-black underline decoration-brand-yellow decoration-2 underline-offset-4 hover:text-brand-black/70" href="#criar-conta">
            Criar cadastro
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

import Link from "next/link";
import { ArrowLeft, HeartHandshake, Sparkles } from "lucide-react";

import { LoginForm } from "./login-form";

export function LoginPage() {
  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl lg:grid-cols-2">
        <section className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
          <Link className="flex items-center gap-2 font-semibold" href="/">
            <HeartHandshake aria-hidden="true" className="size-5" />
            Portal Voluntário
          </Link>
          <div className="max-w-md space-y-6">
            <Sparkles aria-hidden="true" className="size-8" />
            <h1 className="text-4xl font-semibold leading-tight">
              Cada participação constrói uma comunidade mais forte.
            </h1>
            <p className="leading-7 text-primary-foreground/75">
              Acompanhe suas horas, encontre oportunidades e compartilhe o impacto que você está
              ajudando a criar.
            </p>
          </div>
          <p className="text-sm text-primary-foreground/60">Seu espaço para fazer acontecer.</p>
        </section>

        <section className="flex flex-col justify-center px-6 py-10 sm:px-12">
          <Link className="mb-10 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground lg:hidden" href="/">
            <ArrowLeft aria-hidden="true" className="size-4" />
            Voltar para o início
          </Link>
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <Link className="flex items-center gap-2 font-semibold" href="/">
                <HeartHandshake aria-hidden="true" className="size-5 text-primary" />
                Portal Voluntário
              </Link>
            </div>
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}

import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import { PortalBrand } from "@/components/layout/portal-brand";

import { LoginForm } from "./login-form";

export function LoginPage({ nextPath }: { nextPath?: string }) {
  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="grid min-h-screen w-full lg:grid-cols-2">
        <section className="hidden flex-col justify-between border-t-8 border-brand-yellow bg-brand-black p-10 text-white lg:flex">
          <PortalBrand inverse />
          <div className="max-w-md space-y-6">
            <Sparkles aria-hidden="true" className="size-8 text-brand-yellow" />
            <h1 className="text-4xl font-semibold leading-tight">
              Cada participação constrói uma comunidade mais forte.
            </h1>
            <p className="leading-7 text-white/70">
              Acompanhe suas horas, encontre oportunidades e compartilhe o impacto que você está
              ajudando a criar.
            </p>
          </div>
          <p className="text-sm text-white/55">Seu espaço para fazer acontecer.</p>
        </section>

        <section className="flex flex-col justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-yellow/10 via-zinc-50 to-zinc-50 px-6 py-10 sm:px-12">
          <Link className="mb-10 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground lg:hidden" href="/">
            <ArrowLeft aria-hidden="true" className="size-4" />
            Voltar para o início
          </Link>
          <div className="w-full">
            <div className="mb-8 lg:hidden">
              <PortalBrand />
            </div>
            <LoginForm nextPath={nextPath} />
          </div>
        </section>
      </div>
    </main>
  );
}

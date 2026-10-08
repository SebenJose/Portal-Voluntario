import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

import { PortalBrand } from "@/components/layout/portal-brand";

export function AuthPageLayout({ children, titleId }: { children: ReactNode; titleId: string }) {
  return (
    <main aria-labelledby={titleId} className="min-h-svh bg-muted/50 p-4 sm:p-6">
      <div className="mx-auto grid min-h-[calc(100svh-2rem)] max-w-[1440px] sm:min-h-[calc(100svh-3rem)] lg:grid-cols-[0.95fr_1.05fr] lg:gap-8">
        <aside aria-labelledby="auth-intro-title" className="relative hidden flex-col justify-between overflow-hidden rounded-3xl bg-brand-black p-10 text-white lg:flex xl:p-14">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1.5 bg-brand-yellow" />
          <header className="flex items-center gap-5">
            <PortalBrand className="rounded-lg bg-white px-3 py-1" />
            <span className="border-l border-white/20 pl-5 text-sm font-medium leading-5 text-white/75">
              Portal<br />Voluntário
            </span>
          </header>

          <div className="my-14 max-w-md">
            <h2 className="text-[2.75rem] font-semibold leading-[1.12] tracking-tight xl:text-5xl" id="auth-intro-title">
              Seu próximo gesto faz <span className="text-brand-yellow">a diferença.</span>
            </h2>
            <p className="mt-6 max-w-sm text-base leading-7 text-white/65">
              Conecte seu tempo a uma causa. Juntos, construímos uma comunidade mais forte.
            </p>

            <ul className="mt-10 space-y-5 text-sm text-white/85">
              <li>
                Encontre uma causa que combina com você
              </li>
              <li>
                Acompanhe suas horas e sua participação
              </li>
            </ul>
          </div>

          <footer className="flex items-center gap-3 border-t border-white/15 pt-6 text-xs text-white/60">
            <span aria-hidden="true" className="h-1 w-7 rounded-full bg-brand-yellow" />
            Uma iniciativa da comunidade UTFPR
          </footer>
        </aside>

        <section aria-labelledby={titleId} className="flex min-w-0 flex-col px-2 py-2 sm:px-8 sm:py-4 lg:px-10 xl:px-16">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="lg:hidden">
              <PortalBrand />
            </div>
            <Link
              className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm text-muted-foreground transition-colors hover:text-brand-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring lg:ml-auto"
              href="/"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Voltar ao início
            </Link>
          </header>

          <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-10 sm:py-14 lg:py-10">
            {children}

            <p className="mt-8 text-center text-sm leading-6 text-muted-foreground">
              Quer conhecer as causas primeiro?{" "}
              <Link
                className="inline-flex items-center gap-1 rounded-sm font-medium text-brand-black underline decoration-brand-yellow decoration-2 underline-offset-4 hover:decoration-brand-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                href="/oportunidades"
              >
                Explore as oportunidades
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
            </p>
          </div>

          <footer className="text-center text-xs leading-5 text-muted-foreground">
            Portal Voluntário <span aria-hidden="true">·</span> UTFPR
          </footer>
        </section>
      </div>
    </main>
  );
}

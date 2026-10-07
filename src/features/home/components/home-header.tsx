import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { PortalBrand } from "@/components/layout/portal-brand";
import { Button } from "@/components/ui/button";

export function HomeHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <a className="sr-only z-50 rounded-lg bg-brand-yellow p-3 text-brand-black focus:not-sr-only focus:absolute focus:top-3 focus:left-3" href="#conteudo">Ir para o conteúdo</a>
      <div className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <PortalBrand />
          <span className="hidden border-l border-zinc-200 pl-3 text-sm font-semibold leading-4 min-[400px]:block">Portal<br />Voluntário</span>
        </div>
        <nav aria-label="Navegação principal" className="flex items-center gap-4 text-sm sm:gap-7">
          <Link aria-current="page" className="hidden rounded-sm font-semibold underline decoration-brand-yellow decoration-2 underline-offset-8 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-black sm:inline" href="/">Início</Link>
          <Link className="hidden rounded-sm text-zinc-600 transition-colors hover:text-brand-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-black sm:inline" href="/sobre">Sobre</Link>
          <Link className="rounded-sm text-zinc-600 transition-colors hover:text-brand-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-black" href="/oportunidades">Vagas</Link>
          <Button className="h-10 rounded-full bg-brand-black px-4 text-white hover:bg-zinc-800" nativeButton={false} render={<Link href="/entrar" />}>
            Entrar <ArrowUpRight aria-hidden="true" className="size-4" />
          </Button>
        </nav>
      </div>
    </header>
  );
}

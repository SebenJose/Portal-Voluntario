import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { PortalBrand } from "@/components/layout/portal-brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  active?: "home" | "opportunities";
  contentId?: string;
};

export function SiteHeader({ active, contentId = "conteudo" }: SiteHeaderProps) {
  const linkClassName = "rounded-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-black";
  const activeClassName = "font-semibold underline decoration-brand-yellow decoration-2 underline-offset-8";
  const inactiveClassName = "text-zinc-600 hover:text-brand-black";

  return (
    <header className="border-b border-zinc-200 bg-white text-brand-black">
      <a className="sr-only z-50 rounded-lg bg-brand-yellow p-3 text-brand-black focus:not-sr-only focus:absolute focus:top-3 focus:left-3" href={`#${contentId}`}>Ir para o conteúdo</a>
      <div className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <PortalBrand />
          <span className="hidden border-l border-zinc-200 pl-3 text-sm font-semibold leading-4 min-[400px]:block">Portal<br />Voluntário</span>
        </div>
        <nav aria-label="Navegação principal" className="flex items-center gap-4 text-sm sm:gap-7">
          <Link aria-current={active === "home" ? "page" : undefined} className={cn("hidden sm:inline", linkClassName, active === "home" ? activeClassName : inactiveClassName)} href="/">Início</Link>
          <Link aria-current={active === "opportunities" ? "page" : undefined} className={cn(linkClassName, active === "opportunities" ? activeClassName : inactiveClassName)} href="/oportunidades">Vagas</Link>
          <Button className="h-10 rounded-full bg-brand-black px-4 text-white hover:bg-zinc-800" nativeButton={false} render={<Link href="/entrar" />}>
            Entrar <ArrowUpRight aria-hidden="true" className="size-4" />
          </Button>
        </nav>
      </div>
    </header>
  );
}

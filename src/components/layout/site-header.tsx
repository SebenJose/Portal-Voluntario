import Link from "next/link";

import { PortalBrand } from "@/components/layout/portal-brand";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="border-b-4 border-yellow-400 bg-black text-white">
      <div className="flex min-h-24 w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
        <PortalBrand className="text-yellow-400" inverse size="default" />

        <nav aria-label="Navegação principal" className="ml-auto flex flex-wrap items-center justify-end gap-1 sm:gap-3">
          <Button
            className="h-10 px-2 text-sm text-white hover:bg-zinc-900 hover:text-yellow-400 sm:px-3 sm:text-base"
            nativeButton={false}
            render={<Link href="/" />}
            variant="ghost"
          >
            Início
          </Button>
          <Button
            className="h-10 px-2 text-sm text-white hover:bg-zinc-900 hover:text-yellow-400 sm:px-3 sm:text-base"
            nativeButton={false}
            render={<Link href="/sobre" />}
            variant="ghost"
          >
            Sobre
          </Button>
          <Button
            className="h-10 px-2 text-sm text-white hover:bg-zinc-900 hover:text-yellow-400 sm:px-3 sm:text-base"
            nativeButton={false}
            render={<Link href="/oportunidades" />}
            variant="ghost"
          >
            Vagas
          </Button>
          <Button
            className="h-10 bg-yellow-400 px-3 text-sm font-semibold text-black hover:bg-yellow-300 sm:px-5 sm:text-base"
            nativeButton={false}
            render={<Link href="/entrar" />}
          >
            Entrar
          </Button>
        </nav>
      </div>
    </header>
  );
}

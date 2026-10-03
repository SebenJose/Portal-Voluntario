import Link from "next/link";

import { PortalBrand } from "@/components/layout/portal-brand";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="border-b-4 border-yellow-400 bg-black text-white">
      <div className="flex min-h-24 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <PortalBrand className="text-yellow-400" hideNameOnMobile inverse size="large" />

        <nav aria-label="Navegação principal" className="flex items-center gap-2 sm:gap-4">
          <Button
            className="hidden h-11 px-4 text-base text-white hover:bg-zinc-900 hover:text-yellow-400 sm:inline-flex"
            nativeButton={false}
            render={<Link href="#como-funciona" />}
            variant="ghost"
          >
            Como funciona
          </Button>
          <Button
            className="h-11 bg-yellow-400 px-5 text-base font-semibold text-black hover:bg-yellow-300"
            nativeButton={false}
            render={<Link href="/entrar" />}
          >
            Começar
          </Button>
        </nav>
      </div>
    </header>
  );
}

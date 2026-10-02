import Link from "next/link";
import { HeartHandshake } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="border-b bg-background/95">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link className="font-semibold tracking-tight" href="/">
          <span className="flex items-center gap-2">
            <HeartHandshake aria-hidden="true" className="size-5 text-primary" />
            Portal Voluntário
          </span>
        </Link>

        <nav aria-label="Navegação principal" className="flex items-center gap-2">
          <Button render={<Link href="#como-funciona" />} variant="ghost">
            Como funciona
          </Button>
          <Button render={<Link href="/entrar" />}>
            Começar
          </Button>
        </nav>
      </div>
    </header>
  );
}

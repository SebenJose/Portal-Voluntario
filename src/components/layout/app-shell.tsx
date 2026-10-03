import type { LucideIcon } from "lucide-react";
import {
  Award,
  CalendarDays,
  Compass,
  LayoutDashboard,
  LogOut,
  Settings,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { PortalBrand } from "@/components/layout/portal-brand";

type AppShellProps = {
  active: "dashboard" | "opportunities";
  children: ReactNode;
  description: string;
  title: string;
};

type NavigationItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  value: AppShellProps["active"];
};

const navigationItems: Array<NavigationItem> = [
  { href: "/painel", icon: LayoutDashboard, label: "Meu painel", value: "dashboard" },
  { href: "/oportunidades", icon: Compass, label: "Oportunidades", value: "opportunities" },
];

const secondaryItems = [
  { href: "#minhas-atividades", icon: CalendarDays, label: "Minhas atividades" },
  { href: "#certificados", icon: Award, label: "Certificados" },
  { href: "#perfil", icon: UserRound, label: "Meu perfil" },
  { href: "#configuracoes", icon: Settings, label: "Configurações" },
];

function NavigationLink({
  href,
  icon: Icon,
  isActive = false,
  label,
}: {
  href: string;
  icon: LucideIcon;
  isActive?: boolean;
  label: string;
}) {
  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
        isActive
          ? "border-l-4 border-brand-yellow bg-primary pl-2 text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
      href={href}
    >
      <Icon aria-hidden="true" className="size-4" />
      {label}
    </Link>
  );
}

export function AppShell({ active, children, description, title }: AppShellProps) {
  return (
    <div className="min-h-screen bg-muted/20">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r bg-background lg:flex">
        <div className="flex h-24 items-center border-b border-brand-yellow px-5">
          <PortalBrand stacked />
        </div>

        <div className="flex flex-1 flex-col justify-between p-4">
          <div className="space-y-8">
            <nav aria-label="Navegação principal" className="space-y-1">
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Principal
              </p>
              {navigationItems.map((item) => (
                <NavigationLink
                  href={item.href}
                  icon={item.icon}
                  isActive={item.value === active}
                  key={item.value}
                  label={item.label}
                />
              ))}
            </nav>

            <nav aria-label="Atalhos da conta" className="space-y-1">
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Sua jornada
              </p>
              {secondaryItems.map((item) => (
                <NavigationLink href={item.href} icon={item.icon} key={item.label} label={item.label} />
              ))}
            </nav>
          </div>

          <div className="rounded-2xl border bg-muted/40 p-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                JS
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">João Seben</p>
                <p className="truncate text-xs text-muted-foreground">Estudante</p>
              </div>
              <LogOut aria-hidden="true" className="ml-auto size-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-brand-yellow bg-background/90 backdrop-blur lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <PortalBrand hideNameOnMobile />
            <Link className="text-sm font-medium text-primary" href="/">
              Sair
            </Link>
          </div>
          <nav aria-label="Navegação mobile" className="flex gap-1 overflow-x-auto px-4 pb-3">
            {navigationItems.map((item) => (
              <NavigationLink
                href={item.href}
                icon={item.icon}
                isActive={item.value === active}
                key={item.value}
                label={item.label}
              />
            ))}
          </nav>
        </header>

        <main className="w-full px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="mb-8 space-y-2">
            <p className="text-sm font-medium text-primary">Olá, João</p>
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="max-w-2xl text-muted-foreground">{description}</p>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

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
          ? "bg-brand-yellow font-semibold text-brand-black"
          : "text-white/70 hover:bg-white/10 hover:text-white"
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
    <div className="min-h-screen bg-zinc-50">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-white/10 bg-brand-black lg:flex">
        <div className="flex h-24 items-center border-b border-white/10 px-5">
          <PortalBrand inverse stacked />
        </div>

        <div className="flex flex-1 flex-col justify-between p-4">
          <div className="space-y-8">
            <nav aria-label="Navegação principal" className="space-y-1">
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
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
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                Sua jornada
              </p>
              {secondaryItems.map((item) => (
                <NavigationLink href={item.href} icon={item.icon} key={item.label} label={item.label} />
              ))}
            </nav>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-full bg-brand-yellow text-sm font-semibold text-brand-black">
                JS
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">João Seben</p>
                <p className="truncate text-xs text-white/55">Estudante</p>
              </div>
              <LogOut aria-hidden="true" className="ml-auto size-4 text-white/45" />
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-white/10 bg-brand-black text-white backdrop-blur lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <PortalBrand inverse hideNameOnMobile />
            <Link className="text-sm font-medium text-brand-yellow" href="/">
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
            <p className="inline-flex rounded-full border border-brand-yellow/50 bg-brand-yellow/15 px-3 py-1 text-sm font-semibold text-brand-black">Olá, João</p>
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="max-w-2xl text-muted-foreground">{description}</p>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

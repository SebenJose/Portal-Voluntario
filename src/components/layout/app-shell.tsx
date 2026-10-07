"use client";

import type { LucideIcon } from "lucide-react";
import {
  Award,
  CalendarDays,
  ClipboardCheck,
  Compass,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

import { PortalBrand } from "@/components/layout/portal-brand";
import { AuthServiceError, getCurrentUser, logout } from "@/features/auth/services/client-auth";
import type { AuthUser } from "@/features/auth/schemas/session-schema";

type AppShellProps = {
  active: "dashboard" | "opportunities" | "organization";
  children: ReactNode;
  description: string;
  title: string;
  user?: AuthUser | null;
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
  { href: "/organizacao", icon: ClipboardCheck, label: "Gestão de atividades", value: "organization" },
];

const secondaryItems = [
  { href: "/painel#minhas-atividades", icon: CalendarDays, label: "Minhas atividades" },
  { href: "/painel#certificados", icon: Award, label: "Certificados" },
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

export function AppShell({ active, children, description, title, user: initialUser }: AppShellProps) {
  const [sessionUser, setSessionUser] = useState<AuthUser | null>(null);
  const user = initialUser ?? sessionUser;
  const [sessionStatus, setSessionStatus] = useState<"loading" | "ready" | "error">(
    initialUser !== undefined ? "ready" : "loading",
  );
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionAttempt, setSessionAttempt] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (initialUser !== undefined) return;
    let isCurrent = true;
    getCurrentUser()
      .then((currentUser) => {
        if (isCurrent) {
          setSessionUser(currentUser);
          setSessionStatus("ready");
        }
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        setSessionError(error instanceof AuthServiceError
          ? error.message
          : "Não foi possível verificar a sessão.");
        setSessionStatus("error");
      });
    return () => {
      isCurrent = false;
    };
  }, [initialUser, sessionAttempt]);

  function retrySession() {
    setSessionStatus("loading");
    setSessionError(null);
    setSessionAttempt((attempt) => attempt + 1);
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    setSessionError(null);
    try {
      await logout();
      window.location.assign(new URL("/", window.location.href).href);
    } catch (error: unknown) {
      setSessionError(error instanceof AuthServiceError
        ? error.message
        : "Não foi possível encerrar a sessão. Tente novamente.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  const displayName = user?.name ?? "Visitante";
  const initials = user?.name
    .split(" ")
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase("pt-BR"))
    .join("") ?? "V";
  const roleLabel = sessionStatus === "loading"
    ? "Verificando sessão…"
    : user?.role === "organization"
      ? "Organização"
      : user
        ? "Voluntário"
        : "Acesso público";

  return (
    <div className="min-h-screen bg-zinc-50">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-white/10 bg-brand-black lg:flex">
        <div className="flex h-24 items-center border-b border-white/10 px-5">
          <PortalBrand inverse />
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
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{displayName}</p>
                <p className="truncate text-xs text-white/55">{roleLabel}</p>
              </div>
              {user ? (
                <button aria-busy={isLoggingOut} aria-label="Sair da conta" className="ml-auto rounded-md p-2 text-white/65 hover:bg-white/10 hover:text-white disabled:opacity-50" disabled={isLoggingOut} onClick={handleLogout} type="button">
                  <LogOut aria-hidden="true" className="size-4" />
                </button>
              ) : sessionStatus === "error" ? (
                <button className="ml-auto text-xs font-semibold text-brand-yellow" onClick={retrySession} type="button">
                  Tentar novamente
                </button>
              ) : sessionStatus === "loading" ? null : (
                <Link className="ml-auto text-xs font-semibold text-brand-yellow" href="/entrar">Entrar</Link>
              )}
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-white/10 bg-brand-black text-white backdrop-blur lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <PortalBrand inverse />
            {user ? (
              <button aria-busy={isLoggingOut} className="text-sm font-medium text-brand-yellow disabled:opacity-50" disabled={isLoggingOut} onClick={handleLogout} type="button">
                {isLoggingOut ? "Saindo…" : "Sair"}
              </button>
            ) : sessionStatus === "error" ? (
              <button className="text-sm font-medium text-brand-yellow" onClick={retrySession} type="button">Tentar novamente</button>
            ) : sessionStatus === "loading" ? null : (
              <Link className="text-sm font-medium text-brand-yellow" href="/entrar">Entrar</Link>
            )}
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
          {sessionError ? (
            <p className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
              {sessionError}
            </p>
          ) : null}
          <div className="mb-8 space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="max-w-2xl text-muted-foreground">{description}</p>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

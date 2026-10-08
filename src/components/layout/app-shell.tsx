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
import { useEffect, useRef, useState, type ReactNode } from "react";

import { PortalBrand } from "@/components/layout/portal-brand";
import { AuthServiceError, getCurrentUser } from "@/features/auth/services/client-auth";
import { LogoutConfirmationDialog } from "@/features/auth/components/logout-confirmation-dialog";
import { useLogoutConfirmation } from "@/features/auth/hooks/use-logout-confirmation";
import type { AuthUser } from "@/features/auth/schemas/session-schema";

type AppShellProps = {
  active: "dashboard" | "opportunities" | "organization" | "certificates" | "activities" | "demo";
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
  { href: "/minhas-atividades", icon: CalendarDays, label: "Minhas atividades", value: "activities" },
  { href: "/certificados", icon: Award, label: "Meus certificados", value: "certificates" },
];

const prototypeItem: NavigationItem = { href: "/demonstracao/gestao", icon: ClipboardCheck, label: "Demonstração de gestão", value: "demo" };
const organizationItem: NavigationItem = { href: "/organizacao", icon: ClipboardCheck, label: "Gestão de atividades", value: "organization" };

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
  const logoutConfirmation = useLogoutConfirmation();
  const logoutTriggerRef = useRef<HTMLButtonElement | null>(null);
  const { isLoggingOut } = logoutConfirmation;

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
    <>
      <div className="min-h-screen bg-zinc-50">
        <a className="sr-only z-50 rounded-lg bg-brand-yellow p-3 text-brand-black focus:not-sr-only focus:fixed focus:top-3 focus:left-3" href="#conteudo">Ir para o conteúdo</a>
        <aside aria-label="Menu do portal" className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col border-r border-white/10 bg-brand-black lg:flex">
          <header className="flex h-24 items-center border-b border-white/10 px-5">
            <PortalBrand inverse />
          </header>

          <div className="flex flex-1 flex-col justify-between p-4">
            <div className="space-y-8">
              <nav aria-label="Navegação principal" className="space-y-1">
                <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                  Principal
                </p>
                <ul className="space-y-1">
                  {[...navigationItems, ...(user?.role === "organization" ? [organizationItem] : [])].map((item) => (
                    <li key={item.value}>
                      <NavigationLink
                        href={item.href}
                        icon={item.icon}
                        isActive={item.value === active}
                        label={item.label}
                      />
                    </li>
                  ))}
                </ul>
              </nav>

              <nav aria-label="Protótipos" className="space-y-1">
                <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/45">Protótipos</p>
                <ul><li><NavigationLink href={prototypeItem.href} icon={prototypeItem.icon} isActive={active === prototypeItem.value} label={prototypeItem.label} /></li></ul>
              </nav>
            </div>

            <footer aria-label="Perfil da conta" className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-brand-yellow text-sm font-semibold text-brand-black">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{displayName}</p>
                  <p className="truncate text-xs text-white/55">{roleLabel}</p>
                </div>
                {user ? (
                  <button aria-label="Sair da conta" aria-haspopup="dialog" onClick={(event) => { logoutTriggerRef.current = event.currentTarget; logoutConfirmation.onOpenChange(true); }} className="ml-auto rounded-md p-2 text-white/65 hover:bg-white/10 hover:text-white disabled:opacity-50" disabled={isLoggingOut} type="button">
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
            </footer>
          </div>
        </aside>

        <div className="lg:pl-64">
          <header className="sticky top-0 z-10 border-b border-white/10 bg-brand-black text-white backdrop-blur lg:hidden">
            <div className="flex h-16 items-center justify-between px-4">
              <PortalBrand inverse />
              {user ? (
                <button aria-label="Sair da conta" aria-haspopup="dialog" onClick={(event) => { logoutTriggerRef.current = event.currentTarget; logoutConfirmation.onOpenChange(true); }} className="text-sm font-medium text-brand-yellow disabled:opacity-50" disabled={isLoggingOut} type="button">
                  {isLoggingOut ? "Saindo…" : "Sair"}
                </button>
              ) : sessionStatus === "error" ? (
                <button className="text-sm font-medium text-brand-yellow" onClick={retrySession} type="button">Tentar novamente</button>
              ) : sessionStatus === "loading" ? null : (
                <Link className="text-sm font-medium text-brand-yellow" href="/entrar">Entrar</Link>
              )}
            </div>
            <nav aria-label="Navegação mobile" className="overflow-x-auto px-4 pb-3">
              <ul className="flex min-w-max gap-1">
                {[...navigationItems, prototypeItem, ...(user?.role === "organization" ? [organizationItem] : [])].map((item) => (
                  <li key={item.value}>
                    <NavigationLink
                      href={item.href}
                      icon={item.icon}
                      isActive={item.value === active}
                      label={item.label}
                    />
                  </li>
                ))}
              </ul>
            </nav>
          </header>

          <main aria-labelledby="page-title" className="w-full px-4 py-8 sm:px-6 lg:px-8 lg:py-10" id="conteudo" tabIndex={-1}>
            {sessionError ? (
              <p className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
                {sessionError}
              </p>
            ) : null}
            <header className="mb-8 space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight" id="page-title">{title}</h1>
              <p className="max-w-2xl text-muted-foreground">{description}</p>
            </header>
            {children}
          </main>
        </div>
      </div>
      <LogoutConfirmationDialog isOpen={logoutConfirmation.isOpen} onOpenChange={logoutConfirmation.onOpenChange} returnFocus={logoutTriggerRef} error={logoutConfirmation.error} isLoggingOut={isLoggingOut} onConfirm={logoutConfirmation.confirmLogout} />
    </>
  );
}

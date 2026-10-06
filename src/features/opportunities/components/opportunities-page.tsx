"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MotionConfig } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AuthUser } from "@/features/auth/schemas/session-schema";

import {
  getOpportunities,
  OpportunitiesServiceError,
  registerForOpportunity,
} from "../services/opportunities";
import type { Opportunity } from "../types";
import { OpportunityCard } from "./opportunity-card";
import { opportunityCategories, type OpportunityCategory } from "../types";

export function OpportunitiesPage({ user }: { user: AuthUser | null }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<OpportunityCategory | "Todas">("Todas");
  const [registeredIds, setRegisteredIds] = useState<ReadonlySet<string>>(new Set());
  const [opportunities, setOpportunities] = useState<Array<Opportunity>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [registeringIds, setRegisteringIds] = useState<ReadonlySet<string>>(new Set());
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  const loadOpportunities = useCallback(async (signal?: AbortSignal) => {
    try {
      const result = await getOpportunities(signal);
      setOpportunities(result.items);
      setRegisteredIds(new Set(result.registeredIds));
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setLoadError(
        error instanceof OpportunitiesServiceError
          ? error.message
          : "Ocorreu um erro inesperado ao carregar o catálogo.",
      );
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => loadOpportunities(controller.signal));

    return () => controller.abort();
  }, [loadOpportunities]);

  const filteredOpportunities = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();

    return opportunities.filter((opportunity) => {
      const matchesCategory = category === "Todas" || opportunity.category === category;
      const searchableContent = [
        opportunity.title,
        opportunity.organization,
        opportunity.description,
        opportunity.location,
      ]
        .join(" ")
        .toLocaleLowerCase();

      return matchesCategory && searchableContent.includes(normalizedSearch);
    });
  }, [category, opportunities, search]);

  async function handleRegister(opportunityId: string) {
    if (!user) {
      router.push("/entrar?next=%2Foportunidades");
      return;
    }
    if (registeringIds.has(opportunityId) || registeredIds.has(opportunityId)) return;
    setRegistrationError(null);
    setRegisteringIds((currentIds) => new Set(currentIds).add(opportunityId));

    try {
      const result = await registerForOpportunity(opportunityId);
      setRegisteredIds((currentIds) => new Set(currentIds).add(result.opportunityId));
      setOpportunities((currentOpportunities) =>
        currentOpportunities.map((opportunity) =>
          opportunity.id === result.opportunityId
            ? { ...opportunity, enrolled: result.enrolled }
            : opportunity,
        ),
      );
    } catch (error: unknown) {
      if (error instanceof OpportunitiesServiceError && error.status === 401) {
        router.push("/entrar?next=%2Foportunidades");
        return;
      }
      setRegistrationError(
        error instanceof OpportunitiesServiceError
          ? error.message
          : "Ocorreu um erro inesperado ao realizar a inscrição.",
      );
    } finally {
      setRegisteringIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(opportunityId);
        return nextIds;
      });
    }
  }

  return (
    <AppShell
      active="opportunities"
      description="Encontre atividades que combinam com seus interesses e disponibilidade."
      title="Oportunidades"
      user={user}
    >
      <section className="space-y-6">
        {!user ? (
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-semibold">Encontre sua causa. Participe com sua conta.</h2>
              <p className="mt-1 text-sm text-muted-foreground">Você pode explorar as oportunidades. Para se inscrever, entre ou crie uma conta.</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button nativeButton={false} render={<Link href="/entrar?next=%2Foportunidades" />} variant="outline">Entrar</Button>
              <Button className="bg-brand-yellow text-brand-black hover:bg-brand-yellow/85" nativeButton={false} render={<Link href="/criar-conta?next=%2Foportunidades" />}>Criar conta</Button>
            </div>
          </div>
        ) : null}
        <div className="flex flex-col gap-4 rounded-2xl border border-brand-yellow/40 bg-brand-yellow/10 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-label="Buscar oportunidades"
              className="pl-9"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por título, organização ou local..."
              value={search}
            />
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-brand-black">
            <SlidersHorizontal aria-hidden="true" className="size-4" />
            <span>Filtre por eixo:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              className={category === "Todas" ? "bg-brand-yellow text-brand-black hover:bg-brand-yellow/85" : "border-brand-black/20"}
              onClick={() => setCategory("Todas")}
              size="sm"
              variant={category === "Todas" ? "default" : "outline"}
            >
              Todas
            </Button>
            {opportunityCategories.map((option) => (
              <Button
                className={category === option ? "bg-brand-yellow text-brand-black hover:bg-brand-yellow/85" : "border-brand-black/20"}
                key={option}
                onClick={() => setCategory(option)}
                size="sm"
                variant={category === option ? "default" : "outline"}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-muted-foreground">
            {isLoading ? "Carregando oportunidades..." : `${filteredOpportunities.length} oportunidades encontradas`}
          </p>
          {registeredIds.size > 0 ? (
            <Badge variant="secondary">{registeredIds.size} inscrição(ões) realizadas</Badge>
          ) : null}
        </div>

        {registrationError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
            {registrationError}
          </p>
        ) : null}

        {isLoading ? (
          <div aria-live="polite" className="rounded-2xl border border-dashed border-brand-yellow/50 bg-white p-12 text-center" role="status">
            <p className="font-semibold">Buscando oportunidades</p>
            <p className="mt-2 text-sm text-muted-foreground">Isso pode levar alguns instantes.</p>
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border border-dashed border-destructive/40 bg-white p-12 text-center" role="alert">
            <h2 className="font-semibold">Não foi possível carregar o catálogo</h2>
            <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
            <Button
              className="mt-5"
              onClick={() => {
                setIsLoading(true);
                setLoadError(null);
                void loadOpportunities();
              }}
              variant="outline"
            >
              Tentar novamente
            </Button>
          </div>
        ) : filteredOpportunities.length > 0 ? (
          <MotionConfig reducedMotion="user">
            <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
              {filteredOpportunities.map((opportunity) => (
                <OpportunityCard
                  canRegister={Boolean(user)}
                  isRegistered={registeredIds.has(opportunity.id)}
                  isRegistering={registeringIds.has(opportunity.id)}
                  key={opportunity.id}
                  onRegister={handleRegister}
                  opportunity={opportunity}
                />
              ))}
            </div>
          </MotionConfig>
        ) : (
          <div className="rounded-2xl border border-dashed border-brand-yellow/50 bg-brand-yellow/5 p-12 text-center">
            <h2 className="font-semibold">Nenhuma oportunidade encontrada</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tente ajustar sua busca ou selecionar outro eixo temático.
            </p>
          </div>
        )}
      </section>
    </AppShell>
  );
}

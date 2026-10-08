"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { MotionConfig } from "motion/react";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { OpportunityGridSkeleton } from "@/components/layout/route-loading-skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AuthUser } from "@/features/auth/schemas/session-schema";
import { activityCategoryStyles } from "@/lib/activity-categories";

import { useOpportunityCatalog } from "@/features/opportunities/hooks/use-opportunity-catalog";
import { OpportunityCard } from "@/features/opportunities/components/opportunity-card";
import { opportunityCategories, type OpportunityCategory } from "@/features/opportunities/types";

export function OpportunitiesPage({ user }: { user: AuthUser | null }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<OpportunityCategory | "Todas">("Todas");
  const { opportunities, registeredIds, isLoading, loadError, mutationError: registrationError, notice, pendingIds, register, cancel, retry } = useOpportunityCatalog(user?.id, "/oportunidades");

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

  return (
    <AppShell
      active="opportunities"
      description="Encontre atividades que combinam com seus interesses e disponibilidade."
      title="Oportunidades"
      user={user}
    >
      <section aria-labelledby="opportunities-catalog-title" className="space-y-6">
        <h2 className="sr-only" id="opportunities-catalog-title">Catálogo de oportunidades</h2>
        {!user ? (
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-white p-5 sm:flex-row sm:items-center">
            <div>
              <h3 className="font-semibold">Encontre sua causa. Participe com sua conta.</h3>
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
                className={category === option ? activityCategoryStyles[option].badge : "border-brand-black/20"}
                key={option}
                onClick={() => setCategory(option)}
                size="sm"
                variant={category === option ? "default" : "outline"}
              >
                <span aria-hidden="true" className={`size-2 rounded-full ${activityCategoryStyles[option].indicator}`} />
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

        {notice ? <p className="text-sm" role="status">{notice}</p> : null}
        {registrationError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
            {registrationError}
          </p>
        ) : null}

        {isLoading ? (
          <OpportunityGridSkeleton />
        ) : loadError ? (
          <div className="rounded-2xl border border-dashed border-destructive/40 bg-white p-12 text-center" role="alert">
            <h3 className="font-semibold">Não foi possível carregar o catálogo</h3>
            <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
            <Button
              className="mt-5"
              onClick={retry}
              variant="outline"
            >
              Tentar novamente
            </Button>
          </div>
        ) : filteredOpportunities.length > 0 ? (
          <MotionConfig reducedMotion="user">
            <ul className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
              {filteredOpportunities.map((opportunity) => (
                <li key={opportunity.id}>
                  <OpportunityCard
                    canRegister={Boolean(user)}
                    isRegistered={registeredIds.has(opportunity.id)}
                    isRegistering={pendingIds.has(opportunity.id)}
                    onCancel={() => cancel(opportunity.id)}
                    cancellationError={registrationError}
                    onRegister={(id) => { void register(id); }}
                    opportunity={opportunity}
                  />
                </li>
              ))}
            </ul>
          </MotionConfig>
        ) : (
          <div className="rounded-2xl border border-dashed border-brand-yellow/50 bg-brand-yellow/5 p-12 text-center">
            <h3 className="font-semibold">Nenhuma oportunidade encontrada</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Tente ajustar sua busca ou selecionar outro eixo temático.
            </p>
          </div>
        )}
      </section>
    </AppShell>
  );
}

"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { opportunities } from "../data/opportunities";
import { OpportunityCard } from "./opportunity-card";
import { opportunityCategories, type OpportunityCategory } from "../types";

export function OpportunitiesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<OpportunityCategory | "Todas">("Todas");
  const [registeredIds, setRegisteredIds] = useState<ReadonlySet<string>>(new Set());

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
  }, [category, search]);

  function handleRegister(opportunityId: string) {
    setRegisteredIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(opportunityId)) {
        nextIds.delete(opportunityId);
      } else {
        nextIds.add(opportunityId);
      }

      return nextIds;
    });
  }

  return (
    <AppShell
      active="opportunities"
      description="Encontre atividades que combinam com seus interesses e disponibilidade."
      title="Oportunidades"
    >
      <section className="space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center">
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <SlidersHorizontal aria-hidden="true" className="size-4" />
            <span>Filtre por eixo:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setCategory("Todas")}
              size="sm"
              variant={category === "Todas" ? "default" : "outline"}
            >
              Todas
            </Button>
            {opportunityCategories.map((option) => (
              <Button
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
          <p className="text-sm text-muted-foreground">
            {filteredOpportunities.length} oportunidades encontradas
          </p>
          {registeredIds.size > 0 ? (
            <Badge variant="secondary">{registeredIds.size} inscrição(ões) nesta sessão</Badge>
          ) : null}
        </div>

        {filteredOpportunities.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {filteredOpportunities.map((opportunity) => (
              <OpportunityCard
                isRegistered={registeredIds.has(opportunity.id)}
                key={opportunity.id}
                onRegister={handleRegister}
                opportunity={opportunity}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-12 text-center">
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

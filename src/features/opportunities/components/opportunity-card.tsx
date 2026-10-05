"use client";

import { CalendarDays, Clock3, MapPin, Users } from "lucide-react";
import { motion } from "motion/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

import type { Opportunity } from "../types";

type OpportunityCardProps = {
  opportunity: Opportunity;
  isRegistered: boolean;
  isRegistering: boolean;
  onRegister: (opportunityId: string) => void;
};

const categoryStyles: Record<Opportunity["category"], string> = {
  Ensino: "border-brand-yellow/60 bg-brand-yellow/20 text-brand-black",
  Pesquisa: "border-brand-black/25 bg-brand-black/5 text-brand-black",
  Extensão: "border-brand-yellow/40 bg-brand-yellow/10 text-brand-black",
};

export function OpportunityCard({
  opportunity,
  isRegistered,
  isRegistering,
  onRegister,
}: OpportunityCardProps) {
  const isFull = opportunity.enrolled >= opportunity.vacancies;

  return (
    <motion.div
      layout
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="flex h-full flex-col overflow-hidden border-brand-yellow/30 transition-[border-color,box-shadow] hover:border-brand-yellow hover:shadow-md">
        <CardHeader className="gap-4">
          <div className="flex items-center justify-between gap-3">
            <Badge className={categoryStyles[opportunity.category]} variant="outline">
              {opportunity.category}
            </Badge>
            {opportunity.featured ? (
              <span className="rounded-full bg-brand-yellow px-2.5 py-1 text-xs font-semibold text-brand-black">Destaque</span>
            ) : null}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{opportunity.organization}</p>
            <CardTitle className="mt-1 text-xl leading-tight">{opportunity.title}</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="flex-1 space-y-5">
          <p className="text-sm leading-6 text-muted-foreground">{opportunity.description}</p>

          <div className="grid gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <CalendarDays aria-hidden="true" className="size-4 text-brand-black" />
              {opportunity.dateLabel}
            </span>
            <span className="flex items-center gap-2">
              <Clock3 aria-hidden="true" className="size-4 text-brand-black" />
              {opportunity.durationLabel} · {opportunity.hours}h válidas
            </span>
            <span className="flex items-center gap-2">
              <MapPin aria-hidden="true" className="size-4 text-brand-black" />
              {opportunity.format} · {opportunity.location}
            </span>
            <span className="flex items-center gap-2">
              <Users aria-hidden="true" className="size-4 text-brand-black" />
              {opportunity.enrolled}/{opportunity.vacancies} vagas preenchidas
            </span>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            className="w-full"
            disabled={(isFull && !isRegistered) || isRegistered || isRegistering}
            onClick={() => onRegister(opportunity.id)}
            variant={isRegistered ? "secondary" : "default"}
          >
            {isRegistering
              ? "Inscrevendo..."
              : isRegistered
                ? "Inscrição realizada"
                : isFull
                  ? "Vagas esgotadas"
                  : "Quero participar"}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

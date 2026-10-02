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
  onRegister: (opportunityId: string) => void;
};

const categoryStyles: Record<Opportunity["category"], string> = {
  Ensino: "border-sky-200 bg-sky-50 text-sky-700",
  Pesquisa: "border-violet-200 bg-violet-50 text-violet-700",
  Extensão: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function OpportunityCard({
  opportunity,
  isRegistered,
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
      <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
        <CardHeader className="gap-4">
          <div className="flex items-center justify-between gap-3">
            <Badge className={categoryStyles[opportunity.category]} variant="outline">
              {opportunity.category}
            </Badge>
            {opportunity.featured ? (
              <span className="text-xs font-medium text-muted-foreground">Destaque</span>
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
              <CalendarDays aria-hidden="true" className="size-4 text-primary" />
              {opportunity.dateLabel}
            </span>
            <span className="flex items-center gap-2">
              <Clock3 aria-hidden="true" className="size-4 text-primary" />
              {opportunity.durationLabel} · {opportunity.hours}h válidas
            </span>
            <span className="flex items-center gap-2">
              <MapPin aria-hidden="true" className="size-4 text-primary" />
              {opportunity.format} · {opportunity.location}
            </span>
            <span className="flex items-center gap-2">
              <Users aria-hidden="true" className="size-4 text-primary" />
              {opportunity.enrolled}/{opportunity.vacancies} vagas preenchidas
            </span>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            className="w-full"
            disabled={isFull && !isRegistered}
            onClick={() => onRegister(opportunity.id)}
            variant={isRegistered ? "secondary" : "default"}
          >
            {isRegistered ? "Inscrição realizada" : isFull ? "Vagas esgotadas" : "Quero participar"}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

"use client";

import { CalendarDays, Clock3, MapPin, Users } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { activityCategoryStyles } from "@/lib/activity-categories";

import type { Opportunity } from "@/features/opportunities/types";
import { CancelEnrollmentButton } from "@/features/opportunities/components/cancel-enrollment-button";

type OpportunityCardProps = {
  opportunity: Opportunity;
  isRegistered: boolean;
  isRegistering: boolean;
  onRegister: (opportunityId: string) => void;
  canRegister: boolean;
  onCancel: () => Promise<boolean>;
  cancellationError: string | null;
};

export function OpportunityCard({
  opportunity,
  isRegistered,
  isRegistering,
  onRegister,
  canRegister,
  onCancel,
  cancellationError,
}: OpportunityCardProps) {
  const isFull = opportunity.enrolled >= opportunity.vacancies;

  return (
    <motion.article
      aria-labelledby={`opportunity-${opportunity.id}-title`}
      className="h-full"
      layout
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="flex h-full flex-col overflow-hidden border-brand-yellow/30 transition-[border-color,box-shadow] hover:border-brand-yellow hover:shadow-md">
        <CardHeader className="gap-4">
          <div className="flex items-center justify-between gap-3">
            <Badge className={activityCategoryStyles[opportunity.category].badge} variant="outline">
              {opportunity.category}
            </Badge>
            {opportunity.featured ? (
              <span className="rounded-full bg-brand-yellow px-2.5 py-1 text-xs font-semibold text-brand-black">Destaque</span>
            ) : null}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{opportunity.organization}</p>
            <CardTitle as="h3" className="mt-1 text-xl leading-tight" id={`opportunity-${opportunity.id}-title`}>{opportunity.title}</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="flex-1 space-y-5">
          <p className="text-sm leading-6 text-muted-foreground">{opportunity.description}</p>

          <ul className="grid gap-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <CalendarDays aria-hidden="true" className="size-4 text-brand-black" />
              {opportunity.dateLabel}
            </li>
            <li className="flex items-center gap-2">
              <Clock3 aria-hidden="true" className="size-4 text-brand-black" />
              {opportunity.durationLabel} · {opportunity.hours}h válidas
            </li>
            <li className="flex items-center gap-2">
              <MapPin aria-hidden="true" className="size-4 text-brand-black" />
              {opportunity.format} · {opportunity.location}
            </li>
            <li className="flex items-center gap-2">
              <Users aria-hidden="true" className="size-4 text-brand-black" />
              {opportunity.enrolled}/{opportunity.vacancies} vagas preenchidas
            </li>
          </ul>
        </CardContent>

        <CardFooter>
          {isRegistered ? (
            <CancelEnrollmentButton error={cancellationError} isPending={isRegistering} onCancel={onCancel} title={opportunity.title} />
          ) : !canRegister && !isFull ? (
            <Button className="w-full" nativeButton={false} render={<Link href="/entrar?next=%2Foportunidades" />} variant="outline">
              Entre para participar
            </Button>
          ) : <Button
            className="w-full"
            disabled={isFull || isRegistering}
            onClick={() => onRegister(opportunity.id)}
            variant="default"
          >
            {isRegistering
              ? "Inscrevendo..."
              : isFull
                  ? "Vagas esgotadas"
                  : "Quero participar"}
          </Button>}
        </CardFooter>
      </Card>
    </motion.article>
  );
}

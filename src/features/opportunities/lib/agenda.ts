import type { ActivitySession } from "@/features/opportunities/schemas/opportunity-schema";
import type { Opportunity } from "@/features/opportunities/types";

export type AgendaEntry = ActivitySession & { opportunity: Opportunity };

export function getAgendaEntries(activities: readonly Opportunity[]): AgendaEntry[] {
  return activities.flatMap((opportunity) => opportunity.sessions.map((session) => ({ ...session, opportunity })))
    .sort((left, right) => `${left.date}T${left.startsAt}`.localeCompare(`${right.date}T${right.startsAt}`));
}

// Noon in local time keeps date-only values on the same calendar day in every timezone.
export function agendaDate(value: string): Date {
  return new Date(`${value}T12:00:00`);
}

export function dateKey(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

export function formatSessionDate(value: string): string {
  return agendaDate(value).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

export function getNextSessions(entries: readonly AgendaEntry[], now: Date): AgendaEntry[] {
  return entries.filter((entry) => new Date(`${entry.date}T${entry.endsAt}:00`).getTime() >= now.getTime());
}

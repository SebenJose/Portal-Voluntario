"use client";

import { useMemo, useState, type ComponentProps } from "react";
import { ptBR } from "react-day-picker/locale";

import { Badge } from "@/components/ui/badge";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { agendaDate, dateKey, formatSessionDate, getAgendaEntries, getNextSessions } from "@/features/opportunities/lib/agenda";
import type { Opportunity } from "@/features/opportunities/types";
import { activityCategories, activityCategoryStyles } from "@/lib/activity-categories";

type ActivityAgendaProps = { activities: readonly Opportunity[] };

function AgendaDayButton(props: ComponentProps<typeof CalendarDayButton>) {
  const categories = activityCategories.filter((category) => props.modifiers[category]);

  return (
    <CalendarDayButton {...props} locale={ptBR}>
      <span>{props.day.date.getDate()}</span>
      {categories.length > 0 ? (
        <span aria-hidden="true" className="absolute bottom-1 flex gap-0.5">
          {categories.map((category) => <span className={`size-1.5 rounded-full ${activityCategoryStyles[category].indicator}`} key={category} />)}
        </span>
      ) : null}
    </CalendarDayButton>
  );
}

const agendaComponents = { DayButton: AgendaDayButton };

export function ActivityAgenda({ activities }: ActivityAgendaProps) {
  const entries = useMemo(() => getAgendaEntries(activities), [activities]);
  const [now] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const first = getNextSessions(entries, now)[0] ?? entries[0];
    return first ? agendaDate(first.date) : now;
  });
  const [month, setMonth] = useState(selectedDate);
  const selectedKey = dateKey(selectedDate);
  const dayEntries = entries.filter((entry) => entry.date === selectedKey);
  const registeredDays = [...new Set(entries.map((entry) => entry.date))].map(agendaDate);
  const categoryDays = Object.fromEntries(activityCategories.map((category) => [
    category,
    entries.filter((entry) => entry.opportunity.category === category).map((entry) => agendaDate(entry.date)),
  ]));

  return (
    <Card aria-labelledby="activity-agenda-title" as="section" className="border-brand-yellow/30">
      <CardHeader>
        <CardTitle id="activity-agenda-title">Minha agenda</CardTitle>
        <p className="text-sm text-muted-foreground">Selecione um dia para consultar os encontros das suas inscrições.</p>
      </CardHeader>
      <CardContent className="grid items-start gap-6 xl:grid-cols-[auto_1fr]">
        <div className="mx-auto max-w-full">
          <Calendar
            aria-label="Agenda das atividades inscritas"
            className="rounded-xl border [--cell-size:--spacing(9)]"
            components={agendaComponents}
            labels={{
              labelDayButton: (date) => {
                const count = entries.filter((entry) => entry.date === dateKey(date)).length;
                return `${formatSessionDate(dateKey(date))}${count > 0 ? `, ${count} encontro(s)` : ", sem atividades"}`;
              },
              labelNext: () => "Próximo mês",
              labelPrevious: () => "Mês anterior",
            }}
            locale={ptBR}
            mode="single"
            modifiers={{ ...categoryDays, registered: registeredDays }}
            modifiersClassNames={{ registered: "bg-brand-yellow/10" }}
            month={month}
            onMonthChange={setMonth}
            onSelect={(date) => { if (date) setSelectedDate(date); }}
            required
            selected={selectedDate}
          />
          <ul aria-label="Legenda dos eixos da agenda" className="mt-3 flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
            {activityCategories.map((category) => <li className="flex items-center gap-1.5" key={category}><span aria-hidden="true" className={`size-2 rounded-full ${activityCategoryStyles[category].indicator}`} />{category}</li>)}
          </ul>
        </div>
        <section aria-labelledby="agenda-day-title" aria-live="polite" className="min-w-0 space-y-4">
          <h3 className="font-semibold" id="agenda-day-title"><time dateTime={selectedKey}>{formatSessionDate(selectedKey)}</time></h3>
          {dayEntries.length === 0 ? <p className="rounded-xl border border-dashed p-5 text-sm leading-6 text-muted-foreground">Nenhuma atividade inscrita neste dia. Os pontos no calendário indicam os dias com encontros.</p> : (
            <ul className="space-y-3">{dayEntries.map((entry) => <li className="rounded-xl border p-4" key={`${entry.opportunity.id}-${entry.date}-${entry.startsAt}`}>
              <Badge className={activityCategoryStyles[entry.opportunity.category].badge} variant="outline">{entry.opportunity.category}</Badge>
              <h4 className="mt-2 font-medium">{entry.opportunity.title}</h4>
              <p className="mt-1 text-sm text-muted-foreground"><time dateTime={`${entry.date}T${entry.startsAt}`}>{entry.startsAt}</time> – <time dateTime={`${entry.date}T${entry.endsAt}`}>{entry.endsAt}</time></p>
              <p className="mt-1 text-sm text-muted-foreground">{entry.opportunity.format} · {entry.opportunity.location}</p>
            </li>)}</ul>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

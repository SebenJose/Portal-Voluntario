import { z } from "zod";
import { activityCategories } from "@/lib/activity-categories";
import { activitySessionSchema } from "@/features/opportunities/schemas/opportunity-schema";

const integerInput = (maximum: number) => z.string().regex(/^\d+$/u, "Informe um número inteiro.").transform(Number)
  .pipe(z.number().int().min(1, "Informe pelo menos 1.").max(maximum, `Use até ${maximum}.`));

export const opportunityFormSchema = z.object({
  id: z.string().min(1, "Informe o identificador.").max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u, "Use letras minúsculas, números e hífens."),
  title: z.string().trim().min(5, "Use pelo menos 5 caracteres.").max(150),
  description: z.string().trim().min(10, "Use pelo menos 10 caracteres.").max(5000),
  category: z.enum(activityCategories),
  format: z.enum(["Presencial", "Híbrido", "Online"]),
  location: z.string().trim().min(2, "Informe o local.").max(200),
  dateLabel: z.string().trim().min(2, "Informe o período para exibição.").max(200),
  durationLabel: z.string().trim().min(2, "Informe os horários para exibição.").max(200),
  hours: integerInput(200),
  vacancies: integerInput(10000),
  featured: z.boolean(),
  sessions: z.array(activitySessionSchema).min(1, "Adicione um encontro.").max(100),
}).superRefine((values, context) => {
  const sessions = new Set<string>();
  values.sessions.forEach((session, index) => {
    const key = `${session.date}/${session.startsAt}`;
    if (sessions.has(key)) context.addIssue({ code: "custom", path: ["sessions", index, "date"], message: "Este encontro está repetido." });
    sessions.add(key);
  });
});

export type OpportunityFormInput = z.input<typeof opportunityFormSchema>;
export type OpportunityFormValues = z.infer<typeof opportunityFormSchema>;

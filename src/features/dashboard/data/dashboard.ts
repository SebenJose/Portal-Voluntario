import type { HoursCategory, UpcomingActivity } from "../types";

export const hoursSummary = [
  { category: "Ensino", completed: 24, limit: 40 },
  { category: "Pesquisa", completed: 18, limit: 30 },
  { category: "Extensão", completed: 32, limit: 60 },
] satisfies Array<HoursCategory>;

export const upcomingActivities = [
  {
    id: "horta-comunitaria",
    title: "Horta comunitária e educação ambiental",
    organization: "Instituto Sementes do Amanhã",
    dateLabel: "12 out · 8h",
    status: "Inscrito",
  },
  {
    id: "monitoria-programacao",
    title: "Monitoria de programação para iniciantes",
    organization: "UTFPR — Campus Santa Helena",
    dateLabel: "20 out · 14h",
    status: "Presença pendente",
  },
] satisfies Array<UpcomingActivity>;

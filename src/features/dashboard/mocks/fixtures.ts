import { completedDemoActivitySchema, dashboardPresentationSchema } from "@/features/dashboard/schemas/presentation-schema";
import { opportunities } from "@/features/opportunities/data/opportunities";
import { activityCategories } from "@/lib/activity-categories";

const completedActivities = completedDemoActivitySchema.array().parse([
  { id: "demo-monitoria", title: "Monitoria de lógica de programação", organization: "UTFPR — Campus Santa Helena", category: "Ensino", hours: 24, completedAt: "2026-09-18" },
  { id: "demo-pesquisa", title: "Coleta de dados para pesquisa ambiental", organization: "Grupo de Pesquisa em Recursos Hídricos", category: "Pesquisa", hours: 18, completedAt: "2026-09-22" },
  { id: "demo-extensao", title: "Oficinas comunitárias de educação ambiental", organization: "Instituto Sementes do Amanhã", category: "Extensão", hours: 32, completedAt: "2026-09-26" },
]);

export const dashboardPresentation = dashboardPresentationSchema.parse({
  completedActivities,
  hoursSummary: activityCategories.map((category) => ({
    category,
    completed: completedActivities.filter((activity) => activity.category === category)
      .reduce((total, activity) => total + activity.hours, 0),
  })),
  registeredActivities: opportunities.filter((activity) =>
    activity.id === "horta-comunitaria" || activity.id === "monitoria-programacao"),
});

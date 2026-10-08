export const activityCategories = ["Ensino", "Pesquisa", "Extensão"] as const;

export type ActivityCategory = (typeof activityCategories)[number];

export const activityCategoryStyles: Record<
  ActivityCategory,
  { indicator: string; badge: string }
> = {
  Ensino: {
    indicator: "bg-activity-ensino",
    badge: "border-activity-ensino/60 bg-activity-ensino/20 text-brand-black",
  },
  Pesquisa: {
    indicator: "bg-activity-pesquisa",
    badge: "border-activity-pesquisa/25 bg-activity-pesquisa/5 text-brand-black",
  },
  Extensão: {
    indicator: "bg-activity-extensao",
    badge: "border-activity-extensao/35 bg-activity-extensao/10 text-activity-extensao",
  },
};

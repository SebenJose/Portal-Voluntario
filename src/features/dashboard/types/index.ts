import type { ActivityCategory } from "@/lib/activity-categories";

export type HoursCategory = {
  category: ActivityCategory;
  completed: number;
  limit: number;
};

export type UpcomingActivity = {
  id: string;
  title: string;
  organization: string;
  dateLabel: string;
  status: "Inscrito" | "Presença pendente";
};

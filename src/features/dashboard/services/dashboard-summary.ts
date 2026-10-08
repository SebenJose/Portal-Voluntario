import "server-only";

import { activityCategories } from "@/lib/activity-categories";
import { getOpportunityCatalog } from "@/features/opportunities/services/enrollments";
import type { UpcomingActivity } from "@/features/dashboard/types";

export function getDashboardSummary(userId: string) {
  const catalog = getOpportunityCatalog(userId);
  const registered = new Set(catalog.registeredIds);
  const upcomingActivities: UpcomingActivity[] = catalog.items
    .filter((item) => registered.has(item.id))
    .map((item) => ({
      id: item.id,
      title: item.title,
      organization: item.organization,
      dateLabel: item.dateLabel,
      status: "Inscrito",
    }));
  return {
    // No real attendance or approval backend exists; declarations must never grant hours.
    hoursSummary: activityCategories.map((category) => ({ category, completed: 0 })),
    registrations: registered.size,
    upcomingActivities,
  };
}

export type DashboardSummary = ReturnType<typeof getDashboardSummary>;

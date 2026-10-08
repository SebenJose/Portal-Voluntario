import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardPresentation } from "@/features/dashboard/schemas/presentation-schema";
import { formatSessionDate } from "@/features/opportunities/lib/agenda";
import { activityCategoryStyles } from "@/lib/activity-categories";

export function CompletedDemoActivities({ activities }: { activities: DashboardPresentation["completedActivities"] }) {
  return (
    <Card aria-labelledby="completed-demo-title" as="section" className="border-brand-yellow/30">
      <CardHeader><CardTitle id="completed-demo-title">Atividades concluídas</CardTitle><p className="text-sm text-muted-foreground">{activities.length} participações de exemplo com horas registradas.</p></CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {activities.map((activity) => (
            <li className="rounded-xl border p-4" key={activity.id}>
              <div className="flex items-center justify-between gap-3"><Badge className={activityCategoryStyles[activity.category].badge} variant="outline">{activity.category}</Badge><span className="font-semibold">{activity.hours}h</span></div>
              <h3 className="mt-2 font-medium">{activity.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{activity.organization}</p>
              <p className="mt-2 text-xs text-muted-foreground">Concluída em <time dateTime={activity.completedAt}>{formatSessionDate(activity.completedAt)}</time> · Homologação simulada</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

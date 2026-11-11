import type { ManagedActivity } from "@/features/organizations/services/organization-activities";

export type ActivityAttention = {
  activity: ManagedActivity;
  pendingAttendance: number;
  present: number;
  readyToDispatch: boolean;
};

export type OrganizationSummary = {
  activities: number;
  openActivities: number;
  participants: number;
  pendingAttendance: number;
  issuedCertificates: number;
  attention: ActivityAttention[];
};

/** Resume as atividades da organização para o painel: o que está aberto e o que pede ação. */
export function summarizeOrganization(activities: readonly ManagedActivity[]): OrganizationSummary {
  const open = activities.filter((activity) => !activity.certificatesDispatched);
  const attention = open.map((activity) => {
    const pendingAttendance = activity.participants.filter((participant) => participant.status === "Inscrito").length;
    const present = activity.participants.filter((participant) => participant.status === "Presente").length;
    return { activity, pendingAttendance, present, readyToDispatch: present > 0 && pendingAttendance === 0 };
  }).filter((item) => item.pendingAttendance > 0 || item.readyToDispatch);
  return {
    activities: activities.length,
    openActivities: open.length,
    participants: activities.reduce((total, activity) => total + activity.participants.length, 0),
    pendingAttendance: attention.reduce((total, item) => total + item.pendingAttendance, 0),
    issuedCertificates: activities.filter((activity) => activity.certificatesDispatched)
      .reduce((total, activity) => total + activity.participants.filter((participant) => participant.status === "Presente").length, 0),
    attention,
  };
}

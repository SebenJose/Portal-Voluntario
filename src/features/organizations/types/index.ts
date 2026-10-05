export const attendanceStatuses = ["Inscrito", "Presente", "Ausente"] as const;

export type AttendanceStatus = (typeof attendanceStatuses)[number];

export type ActivityParticipant = {
  id: string;
  name: string;
  email: string;
  registeredAt: string;
  status: AttendanceStatus;
};

export type ManagedActivity = {
  id: string;
  title: string;
  dateLabel: string;
  participants: Array<ActivityParticipant>;
  certificatesDispatched: boolean;
};

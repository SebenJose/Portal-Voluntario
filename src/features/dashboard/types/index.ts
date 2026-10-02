export type HoursCategory = {
  category: "Ensino" | "Pesquisa" | "Extensão";
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

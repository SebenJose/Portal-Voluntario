export const opportunityCategories = ["Ensino", "Pesquisa", "Extensão"] as const;

export type OpportunityCategory = (typeof opportunityCategories)[number];

export type Opportunity = {
  id: string;
  title: string;
  organization: string;
  description: string;
  category: OpportunityCategory;
  format: "Presencial" | "Híbrido" | "Online";
  location: string;
  dateLabel: string;
  durationLabel: string;
  hours: number;
  vacancies: number;
  enrolled: number;
  featured?: boolean;
};

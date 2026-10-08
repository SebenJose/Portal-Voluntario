import type { ManagedActivity } from "@/features/organizations/services/organization-activities";

export const organizationActivities: Array<ManagedActivity> = [
  {
    id: "horta-comunitaria",
    title: "Horta comunitária e educação ambiental",
    dateLabel: "17 de outubro · Santa Helena",
    certificatesDispatched: false,
    participants: [
      { id: "p-001", name: "Ana Clara Martins", email: "ana.martins@alunos.utfpr.edu.br", registeredAt: "28 set 2026", status: "Presente" },
      { id: "p-002", name: "Bruno Henrique Lima", email: "bruno.lima@alunos.utfpr.edu.br", registeredAt: "29 set 2026", status: "Inscrito" },
      { id: "p-003", name: "Camila Rocha Silva", email: "camila.silva@alunos.utfpr.edu.br", registeredAt: "30 set 2026", status: "Presente" },
      { id: "p-004", name: "Diego Ferreira Costa", email: "diego.costa@alunos.utfpr.edu.br", registeredAt: "01 out 2026", status: "Ausente" },
      { id: "p-005", name: "Elisa Mendes Alves", email: "elisa.alves@alunos.utfpr.edu.br", registeredAt: "02 out 2026", status: "Inscrito" },
    ],
  },
  {
    id: "monitoria-programacao",
    title: "Monitoria de programação para iniciantes",
    dateLabel: "20 de outubro · UTFPR Santa Helena",
    certificatesDispatched: false,
    participants: [
      { id: "p-006", name: "Felipe Nunes Prado", email: "felipe.prado@alunos.utfpr.edu.br", registeredAt: "25 set 2026", status: "Inscrito" },
      { id: "p-007", name: "Giovana Alves Mendes", email: "giovana.mendes@alunos.utfpr.edu.br", registeredAt: "26 set 2026", status: "Inscrito" },
      { id: "p-008", name: "Heitor Santos Lima", email: "heitor.lima@alunos.utfpr.edu.br", registeredAt: "27 set 2026", status: "Inscrito" },
    ],
  },
];

import type { Metadata } from "next";

import { AboutPage } from "@/features/about";

export const metadata: Metadata = {
  title: "Sobre o portal | Portal Voluntário",
  description: "Conheça a proposta e os recursos do Portal Voluntário da UTFPR.",
};

export default function Page() {
  return <AboutPage />;
}

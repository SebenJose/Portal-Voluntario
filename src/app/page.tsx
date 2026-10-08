import type { Metadata } from "next";

import { HomePage } from "@/features/home";

export const metadata: Metadata = { title: "Início | Portal Voluntário" };

export default function Home() {
  return <HomePage />;
}

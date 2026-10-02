import type { Metadata } from "next";

import { MswProvider } from "@/components/providers/msw-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Portal Voluntário",
  description: "Conectando pessoas e organizações para transformar comunidades.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <MswProvider>{children}</MswProvider>
      </body>
    </html>
  );
}

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";

const highlights = [
  {
    title: "Encontre oportunidades",
    description: "Descubra iniciativas alinhadas aos seus interesses e à sua disponibilidade.",
  },
  {
    title: "Conecte pessoas",
    description: "Organizações e voluntários trabalham juntos para transformar comunidades.",
  },
  {
    title: "Acompanhe seu impacto",
    description: "Tenha uma visão clara das atividades e contribuições realizadas.",
  },
];

export function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        <section className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
                Comunidade em movimento
              </p>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
                Seu tempo pode transformar uma história.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                Um espaço para aproximar pessoas dispostas a ajudar de organizações que fazem a
                diferença todos os dias.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button render={<Link href="/oportunidades" />} size="lg">
                Quero ser voluntário
              </Button>
              <Button render={<Link href="/entrar" />} size="lg" variant="outline">
                Conhecer o portal
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border bg-muted/40 p-8 shadow-sm">
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Próxima evolução</p>
                <h2 className="mt-2 text-2xl font-semibold">O impacto começa com uma conexão.</h2>
              </div>
              <div className="grid gap-3">
                {highlights.map((highlight) => (
                  <div className="rounded-2xl border bg-background p-4" key={highlight.title}>
                    <h3 className="font-medium">{highlight.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {highlight.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y bg-muted/30" id="como-funciona">
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
              Como funciona
            </p>
            <div className="mt-4 grid gap-8 md:grid-cols-3">
              {[
                ["01", "Crie seu perfil", "Conte um pouco sobre você e as causas que importam."],
                ["02", "Encontre seu lugar", "Explore oportunidades que combinam com seu momento."],
                ["03", "Faça acontecer", "Participe, acompanhe seu impacto e inspire outras pessoas."],
              ].map(([number, title, description]) => (
                <article key={number}>
                  <p className="text-sm font-semibold text-primary">{number}</p>
                  <h2 className="mt-3 text-xl font-semibold">{title}</h2>
                  <p className="mt-2 leading-7 text-muted-foreground">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 py-20" id="proximos-passos">
          <div className="rounded-3xl bg-primary px-6 py-12 text-primary-foreground sm:px-12">
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight">
              Uma base pronta para crescer com a sua comunidade.
            </h2>
            <p className="mt-4 max-w-2xl text-primary-foreground/80">
              O projeto já está preparado para receber as próximas funcionalidades do portal.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

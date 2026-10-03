import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/layout/site-header";

import { AnimatedBlock } from "./home-motion";
import { VolunteerCta } from "./volunteer-cta";

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

const steps = [
  {
    number: "01",
    title: "Crie seu perfil",
    description: "Conte um pouco sobre você e as causas que importam.",
    cardClassName: "border-zinc-900 bg-gradient-to-br from-zinc-50 to-zinc-100 text-zinc-950",
    numberClassName: "text-zinc-950 drop-shadow-[0_2px_0_#ffcc00]",
    descriptionClassName: "text-zinc-600",
  },
  {
    number: "02",
    title: "Encontre seu lugar",
    description: "Explore oportunidades que combinam com seu momento.",
    cardClassName: "border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-100/70 text-zinc-950",
    numberClassName: "text-zinc-950 drop-shadow-[0_2px_0_#ffffff]",
    descriptionClassName: "text-zinc-700",
  },
  {
    number: "03",
    title: "Faça acontecer",
    description: "Participe, acompanhe seu impacto e inspire outras pessoas.",
    cardClassName: "border-zinc-900 bg-gradient-to-br from-zinc-50 to-stone-100 text-zinc-950",
    numberClassName: "text-zinc-950 drop-shadow-[0_2px_0_#ffcc00]",
    descriptionClassName: "text-zinc-600",
  },
];

export function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        <section className="grid min-h-[calc(100svh-6rem)] w-full gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-8 lg:py-16 xl:gap-16">
          <div className="space-y-10 lg:self-start">
            <div className="space-y-6">
              <p className="inline-flex bg-yellow-400 px-4 py-2 text-sm font-bold uppercase tracking-[0.16em] text-black">
                Comunidade UTFPR em movimento
              </p>
              <h1 className="max-w-5xl text-5xl font-bold tracking-tight text-balance sm:text-6xl xl:text-7xl">
                Seu tempo pode transformar uma história.
              </h1>
              <p className="max-w-4xl text-xl leading-8 text-zinc-600 xl:text-2xl xl:leading-10">
                Um espaço para conectar a comunidade da UTFPR a iniciativas de voluntariado que
                fazem a diferença dentro e fora do campus.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <VolunteerCta />
              <Button
                className="h-12 px-6 text-base"
                nativeButton={false}
                render={<Link href="/entrar" />}
                size="lg"
                variant="outline"
              >
                Conhecer o portal
              </Button>
            </div>
          </div>

          <AnimatedBlock
            className="rounded-3xl border border-yellow-200 bg-gradient-to-br from-yellow-100 via-amber-50 to-white p-6 shadow-lg shadow-amber-950/5 sm:p-8 xl:p-10"
            delay={0.12}
          >
            <div className="space-y-8">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-zinc-700">
                  Voluntariado na universidade
                </p>
                <h2 className="mt-3 text-3xl font-bold xl:text-4xl">
                  O impacto começa com uma conexão.
                </h2>
              </div>
              <div className="grid gap-4">
                {highlights.map((highlight) => (
                  <div
                    className="rounded-2xl border border-amber-200/80 bg-white/85 p-5 shadow-sm shadow-amber-950/5"
                    key={highlight.title}
                  >
                    <h3 className="text-lg font-semibold">{highlight.title}</h3>
                    <p className="mt-2 text-base leading-7 text-zinc-600">
                      {highlight.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedBlock>
        </section>

        <section className="border-y border-zinc-200 bg-zinc-100" id="como-funciona">
          <div className="w-full px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Como funciona
            </h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {steps.map((step, index) => (
                <AnimatedBlock
                  className={`rounded-2xl border p-6 shadow-sm transition-shadow hover:shadow-md ${step.cardClassName}`}
                  delay={index * 0.1}
                  key={step.number}
                >
                  <article>
                    <p className={`text-3xl font-black leading-none tracking-wide ${step.numberClassName}`}>
                      {step.number}
                    </p>
                    <h3 className="mt-5 text-2xl font-bold">{step.title}</h3>
                    <p className={`mt-3 text-lg leading-8 ${step.descriptionClassName}`}>
                      {step.description}
                    </p>
                  </article>
                </AnimatedBlock>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full px-4 py-20 sm:px-6 lg:px-8" id="proximos-passos">
          <div className="flex flex-col gap-8 rounded-3xl border-l-8 border-yellow-400 bg-black px-6 py-12 text-white sm:px-12 lg:flex-row lg:items-center lg:justify-between lg:py-16">
            <div>
              <h2 className="max-w-4xl text-3xl font-bold tracking-tight sm:text-4xl">
                Leve seu tempo e conhecimento para além do campus.
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-300">
                Descubra oportunidades e acompanhe sua participação em um só lugar.
              </p>
            </div>
            <Button
              className="h-12 bg-yellow-400 px-6 text-base font-semibold text-black hover:bg-yellow-300"
              nativeButton={false}
              render={<Link href="/oportunidades" />}
              size="lg"
            >
              Explorar oportunidades
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}

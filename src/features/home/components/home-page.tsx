import { ArrowRight, Compass, GraduationCap, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AnimatedBlock } from "@/features/home/components/home-motion";
import { SiteHeader } from "@/components/layout/site-header";
import { HomeHeroVisual } from "@/features/home/components/home-hero-visual";
import { VolunteerCta } from "@/features/home/components/volunteer-cta";

type HomeBenefit = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const benefits: HomeBenefit[] = [
  { icon: Compass, title: "Uma causa que combina com você", description: "Encontre oportunidades alinhadas aos seus interesses e à sua disponibilidade." },
  { icon: Users, title: "Conexões que vão além do campus", description: "Conheça pessoas e organizações que também querem fazer a diferença." },
  { icon: GraduationCap, title: "Experiências que ficam com você", description: "Aprenda na prática e acompanhe suas atividades, horas e certificados." },
];

const steps = [
  { number: "01", title: "Conte sua história", description: "Crie seu perfil e apresente seus interesses." },
  { number: "02", title: "Encontre sua causa", description: "Explore as oportunidades e escolha onde participar." },
  { number: "03", title: "Faça a diferença", description: "Participe e acompanhe cada conquista da sua jornada." },
];

export function HomePage() {
  return (
    <div className="min-h-screen bg-[#f7f7f2] text-brand-black">
      <SiteHeader active="home" />
      <main id="conteudo">
        <section aria-labelledby="home-title" className="grid w-full items-center gap-12 px-6 py-12 sm:px-10 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-16 lg:py-20">
          <div>
            <p className="mb-6 inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-600">
              <span aria-hidden="true" className="size-2 rounded-full bg-brand-yellow" />
              Portal Voluntário · UTFPR
            </p>
            <h1 className="text-5xl font-semibold leading-[1.04] tracking-[-0.055em] sm:text-6xl xl:text-7xl" id="home-title">
              Seu tempo.<br />
              Um mundo de<br />
              <span className="relative isolate inline-block">
                <span aria-hidden="true" className="absolute inset-x-0 bottom-1 -z-10 h-[0.3em] bg-brand-yellow sm:bottom-2" />
                possibilidades.
              </span>
            </h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-zinc-600 sm:text-lg sm:leading-8">
              Conecte o que você sabe ao que o mundo precisa. Descubra iniciativas de voluntariado e transforme seu tempo em impacto dentro e fora da UTFPR.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <VolunteerCta />
              <Button className="h-12 rounded-full border-zinc-300 bg-transparent px-6 text-sm font-semibold text-brand-black hover:bg-white" nativeButton={false} render={<Link href="#beneficios" />} size="lg" variant="outline">
                Conhecer o portal
              </Button>
            </div>
            <p className="mt-5 text-xs text-zinc-500">Ensino, pesquisa e extensão. Muitas formas de contribuir.</p>
          </div>
          <AnimatedBlock delay={0.12}>
            <HomeHeroVisual />
          </AnimatedBlock>
        </section>

        <section aria-labelledby="benefits-title" className="border-y border-zinc-200 bg-white" id="beneficios">
          <div className="w-full px-6 py-12 sm:px-10 sm:py-16 lg:px-16">
            <div className="mb-9">
              <h2 className="max-w-lg text-3xl font-semibold tracking-tight sm:text-4xl" id="benefits-title">Você contribui.<br />E também se transforma.</h2>
            </div>
            <div className="grid gap-8 md:grid-cols-3 md:gap-10">
              {benefits.map(({ icon: Icon, title, description }, index) => (
                <AnimatedBlock delay={index * 0.08} key={title}>
                  <article>
                    <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-[#f7f7f2]">
                      <Icon aria-hidden="true" className="size-5" />
                    </div>
                    <h3 className="max-w-xs text-lg font-semibold leading-6">{title}</h3>
                    <p className="mt-3 text-sm leading-6 text-zinc-600">{description}</p>
                  </article>
                </AnimatedBlock>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="journey-title" className="w-full px-6 py-14 sm:px-10 sm:py-20 lg:px-16">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Do primeiro passo ao impacto</p>
              <h2 className="max-w-sm text-3xl font-semibold leading-tight tracking-tight sm:text-4xl" id="journey-title">Uma pequena iniciativa.<br />Um novo começo.</h2>
              <p className="mt-5 max-w-sm text-base leading-7 text-zinc-600">Você não precisa ter todas as respostas. Comece com vontade de participar.</p>
            </div>
            <ol className="grid grid-cols-2 gap-3 sm:gap-4">
              {steps.map((step, index) => (
                <li className={`rounded-2xl border p-5 sm:p-6 ${index === 2 ? "col-span-2 border-brand-yellow bg-brand-yellow" : "border-zinc-200 bg-white"}`} key={step.number}>
                  <span className="text-xs font-semibold tracking-widest text-brand-black/60">{step.number}</span>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-brand-black/65">{step.description}</p>
                  {index === 2 ? (
                    <Link className="mt-5 inline-flex items-center gap-2 rounded-sm text-sm font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-black" href="/oportunidades">
                      Encontrar uma oportunidade <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="invitation-title" className="bg-brand-black text-white">
          <div className="flex w-full flex-col gap-7 px-6 py-12 sm:px-10 sm:py-16 lg:flex-row lg:items-center lg:justify-between lg:px-16">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-brand-yellow">A próxima conexão começa com você</p>
              <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl" id="invitation-title">Tem lugar para o seu talento.</h2>
            </div>
            <Button className="h-12 w-full rounded-full bg-brand-yellow px-6 font-semibold text-brand-black hover:bg-brand-yellow/90 sm:w-auto" nativeButton={false} render={<Link href="/oportunidades" />} size="lg">
              Explorar oportunidades <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}

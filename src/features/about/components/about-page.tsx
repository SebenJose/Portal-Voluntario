import Link from "next/link";
import { ArrowRight, Compass, HandHeart, UsersRound } from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";

const pillars = [
  {
    icon: Compass,
    title: "Descobrir oportunidades",
    description:
      "Consulte iniciativas de voluntariado e veja informações como formato, local, duração e vagas.",
  },
  {
    icon: HandHeart,
    title: "Participar",
    description:
      "Acesse sua conta para se inscrever nas atividades disponíveis e acompanhar suas participações.",
  },
  {
    icon: UsersRound,
    title: "Organizar iniciativas",
    description:
      "Organizações podem divulgar atividades e acompanhar inscrições e presença pelo portal.",
  },
];

export function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        <section className="border-b border-zinc-200 bg-zinc-50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <p className="inline-flex bg-yellow-400 px-4 py-2 text-sm font-bold uppercase tracking-[0.16em] text-black">
              Sobre o portal
            </p>
            <h1 className="mt-6 max-w-4xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
              Um ponto de encontro para iniciativas de voluntariado.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-600 sm:text-xl">
              O Portal Voluntário aproxima a comunidade da UTFPR das oportunidades de participação
              social e reúne ferramentas para descobrir atividades, se inscrever e acompanhar
              iniciativas.
            </p>
            <Button
              className="mt-8 h-12 bg-zinc-950 px-6 text-base font-semibold text-white hover:bg-zinc-800"
              nativeButton={false}
              render={<Link href="/oportunidades" />}
              size="lg"
            >
              Ver oportunidades <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
          </div>
        </section>

        <section aria-labelledby="about-pillars-title" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" id="about-pillars-title">
              O que você encontra aqui
            </h2>
            <p className="mt-4 text-lg leading-8 text-zinc-600">
              Um espaço digital para conectar pessoas e organizações em torno de atividades
              voluntárias.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {pillars.map(({ description, icon: Icon, title }) => (
              <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm" key={title}>
                <span className="flex size-12 items-center justify-center rounded-xl bg-yellow-100 text-zinc-900">
                  <Icon aria-hidden="true" className="size-6" />
                </span>
                <h3 className="mt-5 text-xl font-bold">{title}</h3>
                <p className="mt-3 leading-7 text-zinc-600">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-zinc-950 text-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
            <div>
              <h2 className="text-2xl font-bold sm:text-3xl">Pronto para conhecer as iniciativas?</h2>
              <p className="mt-2 text-zinc-300">Explore as oportunidades ou entre na sua conta.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                className="h-11 bg-yellow-400 px-5 font-semibold text-black hover:bg-yellow-300"
                nativeButton={false}
                render={<Link href="/oportunidades" />}
              >
                Explorar oportunidades
              </Button>
              <Button
                className="h-11 border-white/40 px-5 text-white hover:bg-white/10 hover:text-white"
                nativeButton={false}
                render={<Link href="/entrar" />}
                variant="outline"
              >
                Entrar
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

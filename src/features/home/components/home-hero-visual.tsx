import { HeartHandshake, Sprout } from "lucide-react";

export function HomeHeroVisual() {
  return (
    <div className="relative isolate pb-5 pl-3 sm:pl-5 lg:-translate-x-6">
      <div aria-hidden="true" className="absolute inset-0 top-5 right-3 -z-10 rounded-[2rem] border border-zinc-300 sm:right-5" />
      <div className="relative overflow-hidden rounded-[2rem] bg-brand-black p-6 text-white sm:p-8">
        <p className="text-xs font-medium tracking-[0.1em] text-white/60">GENTE QUE FAZ A DIFERENÇA</p>
        <div aria-hidden="true" className="relative mx-auto my-7 flex aspect-square w-full max-w-64 items-center justify-center sm:my-8">
          <div className="absolute inset-0 rounded-full border border-white/15" />
          <div className="absolute inset-5 rounded-full border border-white/10" />
          <div className="flex size-44 -rotate-12 items-center justify-center rounded-full bg-brand-yellow sm:size-48">
            <HeartHandshake aria-hidden="true" className="size-24 rotate-12 text-brand-black" strokeWidth={1.25} />
          </div>
          <span className="absolute top-5 right-2 flex size-12 items-center justify-center rounded-full border-4 border-brand-black bg-white">
            <Sprout aria-hidden="true" className="size-5 text-brand-black" />
          </span>
        </div>
        <p className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Talento encontra<br /><span className="text-brand-yellow">propósito.</span></p>
        <div className="mt-6 flex flex-wrap gap-2 border-t border-white/15 pt-5 text-xs text-white/70">
          <span className="rounded-full border border-white/20 px-3 py-1.5">Aprender</span>
          <span className="rounded-full border border-white/20 px-3 py-1.5">Conectar</span>
          <span className="rounded-full border border-white/20 px-3 py-1.5">Transformar</span>
        </div>
      </div>
    </div>
  );
}

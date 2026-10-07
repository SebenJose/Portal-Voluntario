import { Skeleton } from "@/components/ui/skeleton";

type AppRouteSkeletonProps = {
  kind: "dashboard" | "cards" | "table";
  title: string;
};

export function AppRouteSkeleton({ kind, title }: AppRouteSkeletonProps) {
  return (
    <div aria-label={`Carregando ${title.toLocaleLowerCase("pt-BR")}`} className="min-h-screen bg-zinc-50" role="status">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-white/10 bg-brand-black p-5 lg:flex">
        <Skeleton className="h-12 w-40 bg-white/15" />
        <div className="mt-12 space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton className="h-10 w-full bg-white/10" key={index} />
          ))}
        </div>
        <Skeleton className="mt-auto h-14 w-full bg-white/10" />
      </aside>

      <main className="px-4 py-8 sm:px-6 lg:ml-64 lg:px-8 lg:py-10">
        <div className="mb-8 space-y-3">
          <h1 className="sr-only">Carregando {title.toLocaleLowerCase("pt-BR")}</h1>
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>

        {kind === "dashboard" ? (
          <>
            <div className="grid gap-5 xl:grid-cols-[1.4fr_0.6fr]">
              <Skeleton className="h-48 rounded-2xl" />
              <Skeleton className="h-48 rounded-2xl" />
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <Skeleton className="h-72 rounded-2xl" />
              <Skeleton className="h-72 rounded-2xl" />
            </div>
          </>
        ) : kind === "table" ? (
          <div className="space-y-5">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-14 rounded-xl" />
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton className="h-16 rounded-xl" key={index} />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton className="h-72 rounded-2xl" key={index} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export function PublicRouteSkeleton({ title }: { title: string }) {
  return (
    <main aria-label={`Carregando ${title.toLocaleLowerCase("pt-BR")}`} className="min-h-screen bg-background" role="status">
      <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white px-5 py-4 sm:px-8">
        <Skeleton className="h-12 w-44" />
        <Skeleton className="h-10 w-40 max-w-[45%] rounded-full" />
      </header>
      <div className="space-y-12 px-4 py-12 sm:px-6 lg:px-8">
        <section className="space-y-5 py-8">
          <h1 className="sr-only">Carregando {title.toLocaleLowerCase("pt-BR")}</h1>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-12 w-3/4 max-w-3xl" />
          <Skeleton className="h-6 w-full max-w-2xl" />
          <Skeleton className="h-6 w-2/3 max-w-xl" />
        </section>
        <div className="grid gap-5 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton className="h-52 rounded-2xl" key={index} />
          ))}
        </div>
      </div>
    </main>
  );
}

export function AuthRouteSkeleton({ title }: { title: string }) {
  return (
    <main aria-label={`Carregando ${title.toLocaleLowerCase("pt-BR")}`} className="min-h-screen bg-zinc-50" role="status">
      <header className="flex h-20 items-center border-b border-zinc-200 bg-white px-4 sm:px-6 lg:px-8">
        <Skeleton className="h-12 w-44" />
      </header>
      <div className="mx-auto max-w-xl px-4 py-12 sm:py-16">
        <div className="mb-6 space-y-3 text-center">
          <h1 className="sr-only">Carregando {title.toLocaleLowerCase("pt-BR")}</h1>
          <Skeleton className="mx-auto h-8 w-56" />
          <Skeleton className="mx-auto h-5 w-72 max-w-full" />
        </div>
        <section className="space-y-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-brand-black/5 sm:p-8">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-5 w-full" />
          {Array.from({ length: title === "Criar conta" ? 4 : 2 }, (_, index) => (
            <div className="space-y-2" key={index}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
          ))}
          <Skeleton className="h-12 w-full rounded-xl" />
        </section>
      </div>
    </main>
  );
}

export function OpportunityGridSkeleton() {
  return (
    <div aria-label="Carregando oportunidades" className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3" role="status">
      {Array.from({ length: 6 }, (_, index) => (
        <div className="space-y-4 rounded-2xl border bg-white p-5" key={index}>
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function OrganizationDataSkeleton() {
  return (
    <div aria-label="Carregando atividades e participantes" className="space-y-5" role="status">
      <Skeleton className="h-28 rounded-2xl" />
      <div className="rounded-2xl border bg-white p-5">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-5 h-10 w-full rounded-lg" />
      </div>
      <div className="space-y-3 rounded-2xl border bg-white p-5">
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton className="h-14 w-full rounded-lg" key={index} />
        ))}
      </div>
    </div>
  );
}

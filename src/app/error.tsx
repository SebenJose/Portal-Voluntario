"use client";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="mx-auto max-w-xl space-y-5 px-6 py-20">
    <h1 className="text-2xl font-semibold">Não foi possível carregar esta página</h1>
    <p className="text-muted-foreground" role="alert">O serviço está indisponível no momento. Tente novamente em instantes.</p>
    <Button onClick={reset}>Tentar novamente</Button>
  </main>;
}

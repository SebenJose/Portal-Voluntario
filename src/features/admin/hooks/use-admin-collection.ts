"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AdminServiceError } from "@/features/admin/services/admin";

type Identified = { id: string };

/**
 * Carrega uma lista da administração, refaz a busca quando o filtro muda e permite atualizar itens.
 * `load` deve ser uma função de serviço estável (definida fora do componente).
 */
export function useAdminCollection<T extends Identified, F>(load: (filter: F, signal: AbortSignal) => Promise<T[]>, filter: F, returnPath: string) {
  const router = useRouter();
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      setIsLoading(true);
      setError(null);
      try {
        const result = await load(filter, controller.signal);
        if (!controller.signal.aborted) setItems(result);
      } catch (cause: unknown) {
        if (controller.signal.aborted) return;
        if (cause instanceof AdminServiceError && cause.status === 401) {
          router.replace(`/entrar?next=${encodeURIComponent(returnPath)}`);
          return;
        }
        setError(cause instanceof AdminServiceError ? cause.message : "Não foi possível carregar os dados da administração.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    });
    return () => controller.abort();
  }, [load, filter, attempt, returnPath, router]);

  return {
    items, isLoading, error,
    retry: () => setAttempt((current) => current + 1),
    /** Substitui o item atualizado; remove-o quando deixa de corresponder ao filtro. */
    replace: (item: T, stillMatches: boolean) => setItems((current) => stillMatches
      ? current.map((existing) => existing.id === item.id ? item : existing)
      : current.filter((existing) => existing.id !== item.id)),
  };
}

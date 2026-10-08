"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { cancelOpportunityRegistration, getOpportunities, OpportunitiesServiceError, registerForOpportunity } from "@/features/opportunities/services/opportunities";
import type { Opportunity } from "@/features/opportunities/types";

export function useOpportunityCatalog(userId: string | undefined, returnPath: string) {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [registeredIds, setRegisteredIds] = useState<ReadonlySet<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set());
  const pendingRequests = useRef(new Set<string>());
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      setIsLoading(true);
      setLoadError(null);
      setOpportunities([]);
      setRegisteredIds(new Set());
      try {
        const result = await getOpportunities(controller.signal);
        if (controller.signal.aborted) return;
        setOpportunities(result.items);
        setRegisteredIds(new Set(result.registeredIds));
      } catch (error: unknown) {
        if (controller.signal.aborted) return;
        setLoadError(error instanceof OpportunitiesServiceError ? error.message : "Não foi possível carregar suas atividades. Tente novamente.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    });
    return () => controller.abort();
  }, [attempt, userId]);

  async function changeRegistration(opportunityId: string, registered: boolean): Promise<boolean> {
    if (!userId) {
      router.push(`/entrar?next=${encodeURIComponent(returnPath)}`);
      return false;
    }
    if (pendingRequests.current.has(opportunityId)) return false;
    pendingRequests.current.add(opportunityId);
    setPendingIds(new Set(pendingRequests.current));
    setMutationError(null);
    setNotice(null);
    try {
      const result = registered
        ? await registerForOpportunity(opportunityId)
        : await cancelOpportunityRegistration(opportunityId);
      setRegisteredIds((current) => {
        const next = new Set(current);
        if (result.registered) next.add(result.opportunityId);
        else next.delete(result.opportunityId);
        return next;
      });
      setOpportunities((current) => current.map((item) => item.id === result.opportunityId ? { ...item, enrolled: result.enrolled } : item));
      setNotice(registered ? "Inscrição realizada. Os encontros estão na sua agenda." : "Inscrição cancelada. Os encontros foram removidos da sua agenda.");
      return true;
    } catch (error: unknown) {
      if (error instanceof OpportunitiesServiceError && error.status === 401) {
        router.push(`/entrar?next=${encodeURIComponent(returnPath)}`);
      }
      setMutationError(error instanceof OpportunitiesServiceError ? error.message : "Não foi possível atualizar a inscrição. Tente novamente.");
      return false;
    } finally {
      pendingRequests.current.delete(opportunityId);
      setPendingIds(new Set(pendingRequests.current));
    }
  }

  const registeredActivities = useMemo(() => opportunities.filter((item) => registeredIds.has(item.id)), [opportunities, registeredIds]);
  return {
    opportunities, registeredIds, registeredActivities, isLoading, loadError, mutationError, notice, pendingIds,
    register: (id: string) => changeRegistration(id, true),
    cancel: (id: string) => changeRegistration(id, false),
    retry: () => setAttempt((current) => current + 1),
  };
}

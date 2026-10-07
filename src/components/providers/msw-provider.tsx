"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

import { PublicRouteSkeleton } from "@/components/layout/route-loading-skeletons";

type MswProviderProps = {
  children: ReactNode;
};

type StartupState = "starting" | "ready" | "error";

const shouldMockApi =
  (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_API_MOCKING !== "disabled") ||
  (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_API_MOCKING === "enabled");

let startupPromise: Promise<void> | undefined;

function startMockWorker(): Promise<void> {
  if (!startupPromise) {
    startupPromise = import("@/mocks/browser")
      .then(({ worker }) => worker.start({ onUnhandledFrame: "bypass" }))
      .then(() => undefined)
      .catch((error: unknown) => {
        startupPromise = undefined;
        throw error;
      });
  }

  return startupPromise;
}

export function MswProvider({ children }: MswProviderProps) {
  const [state, setState] = useState<StartupState>(shouldMockApi ? "starting" : "ready");
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setState("starting");
    setAttempt((currentAttempt) => currentAttempt + 1);
  }, []);

  useEffect(() => {
    if (!shouldMockApi) {
      return;
    }

    let active = true;
    void startMockWorker().then(
      () => {
        if (active) setState("ready");
      },
      () => {
        if (active) setState("error");
      },
    );

    return () => {
      active = false;
    };
  }, [attempt]);

  if (state === "ready") {
    return children;
  }

  if (state === "error") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-12">
        <section aria-labelledby="msw-error-title" className="w-full max-w-lg space-y-5 rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
          <div aria-live="assertive" role="alert">
            <h1 className="text-2xl font-bold" id="msw-error-title">Não foi possível preparar a demonstração</h1>
            <p className="mt-3 leading-7 text-zinc-600">
              O serviço de demonstração não iniciou. Tente novamente para carregar o portal.
            </p>
          </div>
          <button
            className="min-h-11 rounded-md bg-zinc-950 px-5 font-semibold text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
            onClick={retry}
            type="button"
          >
            Tentar novamente
          </button>
        </section>
      </main>
    );
  }

  return <PublicRouteSkeleton title="Portal Voluntário" />;
}

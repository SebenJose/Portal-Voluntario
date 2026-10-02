"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

type MswProviderProps = {
  children: ReactNode;
};

const shouldMockApi =
  process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_API_MOCKING !== "disabled";

export function MswProvider({ children }: MswProviderProps) {
  useEffect(() => {
    if (!shouldMockApi) {
      return;
    }

    void Promise.all([import("msw/browser"), import("@/mocks/handlers")])
      .then(([{ setupWorker }, { handlers }]) => setupWorker(...handlers))
      .then((worker) => worker.start({ onUnhandledFrame: "bypass" }))
      .catch((error: unknown) => {
        console.error("Não foi possível iniciar o MSW.", error);
      });
  }, []);

  return children;
}

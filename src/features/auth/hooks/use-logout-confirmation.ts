"use client";

import { useState } from "react";

import { AuthServiceError, logout } from "@/features/auth/services/client-auth";

export function useLogoutConfirmation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onOpenChange(open: boolean): void {
    if (isLoggingOut) return;
    setError(null);
    setIsOpen(open);
  }

  async function confirmLogout(): Promise<void> {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setError(null);
    try {
      await logout();
      window.location.assign(new URL("/", window.location.href).href);
    } catch (cause: unknown) {
      setError(cause instanceof AuthServiceError
        ? cause.message
        : "Não foi possível encerrar a sessão. Tente novamente.");
      setIsLoggingOut(false);
    }
  }

  return { isOpen, isLoggingOut, error, onOpenChange, confirmLogout };
}

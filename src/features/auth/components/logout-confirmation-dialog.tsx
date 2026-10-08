"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { useRef, type RefObject } from "react";

import { Button } from "@/components/ui/button";

type LogoutConfirmationDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocus: RefObject<HTMLButtonElement | null>;
  isLoggingOut: boolean;
  error: string | null;
  onConfirm: () => Promise<void>;
};

export function LogoutConfirmationDialog({ isOpen, onOpenChange, returnFocus, isLoggingOut, error, onConfirm }: LogoutConfirmationDialogProps) {
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  return (
    <AlertDialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/45" />
        <AlertDialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100vw_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-background p-6 shadow-xl" initialFocus={cancelRef} finalFocus={returnFocus}>
          <header className="space-y-3">
            <AlertDialog.Title className="text-xl font-semibold text-foreground">Sair da sua conta?</AlertDialog.Title>
            <AlertDialog.Description className="text-sm leading-6 text-muted-foreground">
              Você precisará entrar novamente para acessar seu painel e seus certificados.
            </AlertDialog.Description>
          </header>
          {error ? <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">{error}</p> : null}
          <footer className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <AlertDialog.Close disabled={isLoggingOut} ref={cancelRef} render={<Button variant="outline" />}>Cancelar</AlertDialog.Close>
            <Button aria-busy={isLoggingOut} disabled={isLoggingOut} onClick={() => { void onConfirm(); }} type="button">
              {isLoggingOut ? "Saindo..." : error ? "Tentar sair novamente" : "Sim, sair"}
            </Button>
          </footer>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

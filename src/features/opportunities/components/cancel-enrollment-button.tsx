"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";

type CancelEnrollmentButtonProps = {
  title: string;
  isPending: boolean;
  error: string | null;
  onCancel: () => Promise<boolean>;
};

export function CancelEnrollmentButton({ title, isPending, error, onCancel }: CancelEnrollmentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  async function confirmCancellation(): Promise<void> {
    const cancelled = await onCancel();
    if (cancelled) setIsOpen(false);
    else setHasFailed(true);
  }

  return (
    <AlertDialog.Root open={isOpen} onOpenChange={(open) => {
      if (isPending) return;
      setHasFailed(false);
      setIsOpen(open);
    }}>
      <AlertDialog.Trigger disabled={isPending} render={<Button className="w-full" variant="outline" />}>Cancelar inscrição</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/45" />
        <AlertDialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100vw_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-background p-6 shadow-xl" initialFocus={cancelRef}>
          <AlertDialog.Title className="text-xl font-semibold">Cancelar sua inscrição?</AlertDialog.Title>
          <AlertDialog.Description className="mt-3 text-sm leading-6 text-muted-foreground">Você deixará de participar de “{title}”. Todos os encontros dessa atividade sairão da sua agenda e a vaga será liberada.</AlertDialog.Description>
          {hasFailed ? <p className="mt-4 text-sm text-destructive" role="alert">{error ?? "Não foi possível cancelar. Tente novamente."}</p> : null}
          <footer className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <AlertDialog.Close disabled={isPending} ref={cancelRef} render={<Button variant="outline" />}>Manter inscrição</AlertDialog.Close>
            <Button aria-busy={isPending} disabled={isPending} onClick={() => { void confirmCancellation(); }} variant="destructive">{isPending ? "Cancelando..." : "Sim, cancelar inscrição"}</Button>
          </footer>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

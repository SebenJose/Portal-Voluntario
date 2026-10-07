"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function VolunteerCta() {
  return (
    <span className="flex w-full sm:w-auto">
      <Button
        className="h-12 w-full gap-3 rounded-full bg-brand-yellow px-6 text-sm font-semibold text-brand-black hover:bg-brand-yellow/85 sm:w-auto"
        nativeButton={false}
        render={<Link href="/oportunidades" />}
        size="lg"
      >
        Quero ser voluntário
        <ArrowRight aria-hidden="true" className="size-4" />
      </Button>
    </span>
  );
}

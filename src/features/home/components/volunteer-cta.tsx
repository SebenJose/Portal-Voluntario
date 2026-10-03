"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";

export function VolunteerCta() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <span className="relative isolate flex w-full rounded-md sm:w-auto">
      {prefersReducedMotion === false ? (
        <motion.span
          animate={{ opacity: [0.55, 0], scale: [1, 1.14] }}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 rounded-md border-2 border-brand-yellow"
          transition={{ duration: 2, ease: "easeOut", repeat: Infinity, repeatDelay: 0.4 }}
        />
      ) : null}
      <Button
        className="relative z-10 h-12 w-full px-6 text-base sm:w-auto"
        nativeButton={false}
        render={<Link href="/oportunidades" />}
        size="lg"
      >
        Quero ser voluntário
      </Button>
    </span>
  );
}

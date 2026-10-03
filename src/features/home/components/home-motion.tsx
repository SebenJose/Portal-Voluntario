"use client";

import type { ReactNode } from "react";

import { MotionConfig, motion } from "motion/react";

type AnimatedBlockProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export function AnimatedBlock({ children, className, delay = 0 }: AnimatedBlockProps) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        className={className}
        initial={{ opacity: 0, y: 16 }}
        transition={{ delay, duration: 0.45, ease: "easeOut" }}
        viewport={{ amount: 0.18, once: true }}
        whileInView={{ opacity: 1, y: 0 }}
        whileHover={{ y: -3 }}
      >
        {children}
      </motion.div>
    </MotionConfig>
  );
}

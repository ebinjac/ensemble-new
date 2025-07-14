'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedBeamProps extends Omit<HTMLMotionProps<"div">, keyof React.HTMLAttributes<HTMLDivElement>> {
  className?: string;
}

export function AnimatedBeam({ className, ...props }: AnimatedBeamProps) {
  return (
    <motion.div
      className={cn("relative", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      {...props}
    >
      <motion.div
        className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/50 to-purple-500/50 blur-xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <div className="relative w-full h-full bg-background/90 rounded-lg" />
    </motion.div>
  );
} 
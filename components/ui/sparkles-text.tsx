'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SparklesTextProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
}

export function SparklesText({ children, as = 'span', className, ...props }: SparklesTextProps) {
  const Component = motion[as as keyof typeof motion];

  return (
    <Component
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{
        duration: 0.5,
        ease: "easeOut",
      }}
      className={cn(
        "relative inline-block",
        className
      )}
      {...props}
    >
      <span className="relative inline-block">
        {children}
        <motion.span
          className="absolute -inset-2 block opacity-0"
          initial={{ scale: 0 }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatDelay: 3,
          }}
        >
          ✨
        </motion.span>
      </span>
    </Component>
  );
} 
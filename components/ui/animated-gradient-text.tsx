'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface AnimatedGradientTextProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function AnimatedGradientText({ children, className, ...props }: AnimatedGradientTextProps) {
  return (
    <div
      className={cn(
        "animate-gradient bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent bg-300% font-bold",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Add this to your globals.css or tailwind.config.js
// @keyframes gradient {
//   0% { background-position: 0% 50%; }
//   50% { background-position: 100% 50%; }
//   100% { background-position: 0% 50%; }
// }
// .animate-gradient {
//   animation: gradient 8s ease infinite;
// }
// .bg-300\% {
//   background-size: 300%;
// } 
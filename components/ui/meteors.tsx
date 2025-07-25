'use client';

import { cn } from "@/lib/utils";
import React from "react";

interface MeteorsProps {
  number?: number;
  className?: string;
}

export function Meteors({ number = 20, className }: MeteorsProps) {
  const meteors = new Array(number).fill(null);

  return (
    <>
      {meteors.map((_, idx) => (
        <span
          key={idx}
          className={cn(
            "animate-meteor absolute top-1/2 left-1/2 h-0.5 w-0.5 rounded-[9999px] bg-slate-500 shadow-[0_0_0_1px_#ffffff10] rotate-[215deg]",
            "before:content-[''] before:absolute before:top-1/2 before:transform before:-translate-y-1/2 before:w-[50px] before:h-[1px] before:bg-gradient-to-r before:from-[#64748b] before:to-transparent",
            className
          )}
          style={{
            top: 0,
            left: Math.floor(Math.random() * 100) + "%",
            animationDelay: Math.random() * (0.8 - 0.2) + 0.2 + "s",
            animationDuration: Math.floor(Math.random() * (10 - 2) + 2) + "s",
          }}
        />
      ))}
    </>
  );
}

// Add this to your globals.css or tailwind.config.js
// @keyframes meteor {
//   0% {
//     transform: rotate(215deg) translateX(0);
//     opacity: 1;
//   }
//   70% {
//     opacity: 1;
//   }
//   100% {
//     transform: rotate(215deg) translateX(-500px);
//     opacity: 0;
//   }
// }
// .animate-meteor {
//   animation: meteor linear infinite;
// } 
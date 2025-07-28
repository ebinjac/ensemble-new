"use client";

import { motion, Variants, easeOut } from "framer-motion";
import Link from "next/link";
import { DIcons } from "dicons";
import { Button } from "@/components/ui/button";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: easeOut,
    },
  },
};

const iconVariants: Variants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      duration: 0.5,
      ease: easeOut,
    },
  },
};

export function Hero() {
  return (
    <section id="home" className="relative min-h-[80vh] flex items-center">
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full"
        >
          <div className="flex flex-col items-center justify-center text-center">
            {/* Status Badge */}
            <motion.div
              variants={itemVariants}
              className="z-10 mb-6 sm:justify-center md:mb-8"
            >
              <div className="relative flex items-center whitespace-nowrap rounded-full border bg-popover/80 backdrop-blur-sm px-4 py-1.5 text-sm leading-6 text-black dark:text-white">
                <DIcons.Shapes className="h-5 p-1" />
                <span className="flex items-center gap-2">
                  Ensemble Portal is now beta
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex h-full w-full rounded-full bg-green-500"></span>
                  </span>
                </span>
              </div>
            </motion.div>

            {/* Main Heading Container */}
            <motion.div variants={itemVariants} className="px-2 w-full">
              <div className="border-black/20 dark:border-white/20 relative mx-auto h-full max-w-7xl border p-6 [mask-image:radial-gradient(800rem_96rem_at_center,white,transparent)] md:px-12 md:py-20">
                <motion.div
                  variants={iconVariants}
                  className="text-black dark:text-white absolute -left-5 -top-5"
                >
                  <DIcons.Plus strokeWidth={4} className="h-10 w-10" />
                </motion.div>
                <motion.div
                  variants={iconVariants}
                  className="text-black dark:text-white absolute -bottom-5 -left-5"
                >
                  <DIcons.Plus strokeWidth={4} className="h-10 w-10" />
                </motion.div>
                <motion.div
                  variants={iconVariants}
                  className="text-black dark:text-white absolute -right-5 -top-5"
                >
                  <DIcons.Plus strokeWidth={4} className="h-10 w-10" />
                </motion.div>
                <motion.div
                  variants={iconVariants}
                  className="text-black dark:text-white absolute -bottom-5 -right-5"
                >
                  <DIcons.Plus strokeWidth={4} className="h-10 w-10" />
                </motion.div>
                
                <motion.h1 
                  className="text-4xl font-bold tracking-tight md:text-7xl lg:text-8xl bg-clip-text text-transparent bg-gradient-to-r from-black via-black/60 to-black/70 dark:from-white dark:via-white/60 dark:to-white/70"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  Tools United. <br /> Workflows Simplified.
                </motion.h1>
              </div>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              variants={itemVariants}
              className="mx-auto mt-6 max-w-2xl text-lg text-black/60 dark:text-white/60 md:text-xl"
            >
              Reduce manual effort, boost productivity, and centralize your operational tools with Ensemble.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="mt-10 flex flex-wrap justify-center gap-4"
            >
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Get Started
                  <motion.span
                    className="ml-2"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    →
                  </motion.span>
                </Button>
              </Link>
              <Link href="/docs">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-primary/20 hover:bg-primary/5"
                >
                  View Documentation
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Background Effect */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/2 to-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />
      </div>
    </section>
  );
}

 

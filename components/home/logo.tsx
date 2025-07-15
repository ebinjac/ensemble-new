"use client";

import React from 'react';
import { motion } from 'framer-motion';

const EnsembleLogo = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.15
      }
    }
  };

  const elementVariants = {
    hidden: { 
      opacity: 0,
      y: 10,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15,
        duration: 0.8
      }
    },
    hover: {
      scale: 1.03,
      transition: {
        duration: 0.3
      }
    }
  };

  // American Express blue shades
  const blueGradient = {
    gradient1: "#006FCF",  // Primary blue
    gradient2: "#0057B8",  // Darker blue
    gradient3: "#003D7E"   // Deep navy
  };

  return (
    <motion.div
      className="flex items-center justify-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
    >
      <motion.svg
        className="w-12 h-12"
        viewBox="0 0 492.481 492.481"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* First layer with blue gradient */}
        <defs>
          <linearGradient id="blueGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={blueGradient.gradient1} />
            <stop offset="100%" stopColor={blueGradient.gradient2} />
          </linearGradient>
          <linearGradient id="blueGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={blueGradient.gradient2} />
            <stop offset="100%" stopColor={blueGradient.gradient3} />
          </linearGradient>
          <linearGradient id="blueGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={blueGradient.gradient1} />
            <stop offset="100%" stopColor={blueGradient.gradient3} />
          </linearGradient>
        </defs>

        <motion.g variants={elementVariants}>
          <polygon 
            fill="url(#blueGradient1)" 
            points="25.687,297.141 135.735,0 271.455,0 161.398,297.141"
          />
        </motion.g>

        <motion.g variants={elementVariants}>
          <polygon 
            fill="url(#blueGradient2)" 
            points="123.337,394.807 233.409,97.674 369.144,97.674 259.072,394.807"
          />
        </motion.g>

        <motion.g variants={elementVariants}>
          <polygon 
            fill="url(#blueGradient3)" 
            points="221.026,492.481 331.083,195.348 466.794,195.348 356.746,492.481"
          />
        </motion.g>

        {/* Optional: Add a subtle 'e' in negative space */}
        <motion.path
          d="M200,250 Q230,220 260,250 Q290,280 260,310 Q230,340 200,310 Q170,280 200,250 Z"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeOpacity="0.3"
          variants={elementVariants}
        />
      </motion.svg>
    </motion.div>
  );
};

export default EnsembleLogo;
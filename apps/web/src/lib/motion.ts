// apps/web/src/lib/motion.ts
import type { Transition } from "motion/react";

export const EDITORIAL_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const SPRING_TACTILE: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 32,
  mass: 0.8,
};

export const SPRING_DRAWER: Transition = {
  type: "spring",
  stiffness: 340,
  damping: 36,
};

export const HERO_REVEAL = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      delay,
      ease: EDITORIAL_EASE,
    },
  }),
};

export const STAGGER_LIST = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04,
    },
  },
};

export const STAGGER_ITEM = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.24, ease: EDITORIAL_EASE },
  },
};

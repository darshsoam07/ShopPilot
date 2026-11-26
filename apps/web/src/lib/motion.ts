/**
 * ShopPilot motion engine.
 *
 * One place for timings, curves, springs, variants, scroll hooks and the
 * reduced-motion policy. Values mirror the CSS tokens in styles/tokens.css
 * (seconds here, milliseconds there). Components import from here and never
 * invent a curve or a duration.
 *
 * Reduced motion has two layers and only two:
 *   1. CSS: the single block at the end of styles/base.css.
 *   2. JS: <MotionConfig reducedMotion="user"> in main.tsx handles motion
 *      components; the hooks below handle scroll-linked values and Lenis.
 */
import { useMemo, useState, useSyncExternalStore, type RefObject } from "react";
import {
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
  type Transition,
  type Variants,
} from "motion/react";

/* Curves */

type Bezier = [number, number, number, number];

export const EASE: { out: Bezier; inOut: Bezier; drawer: Bezier } = {
  out: [0.23, 1, 0.32, 1], // entering, exiting, default
  inOut: [0.77, 0, 0.175, 1], // moving on screen
  drawer: [0.32, 0.72, 0, 1], // drawers and sheets
};

/* Durations (seconds) */

export const DUR = {
  press: 0.12,
  hover: 0.16,
  ui: 0.22,
  enter: 0.26,
  drawer: 0.38,
  reveal: 0.45, // ceiling for scroll-triggered reveals
} as const;

/** Gap between siblings in a staggered entrance (30 to 80ms). */
export const STAGGER = 0.05;

export const TRANSITION = {
  press: { duration: DUR.press, ease: EASE.out },
  hover: { duration: DUR.hover, ease: EASE.out },
  ui: { duration: DUR.ui, ease: EASE.out },
  enter: { duration: DUR.enter, ease: EASE.out },
  reveal: { duration: DUR.reveal, ease: EASE.out },
  move: { duration: DUR.enter, ease: EASE.inOut },
  drawer: { duration: DUR.drawer, ease: EASE.drawer },
} satisfies Record<string, Transition>;

/* Springs: interruptible, retarget from the current value */

export const SPRING = {
  /** Drawers and sheets. No bounce. */
  drawer: { type: "spring", duration: 0.42, bounce: 0 },
  /** layoutId indicators: nav pill, SKU pill, stepper bar. */
  indicator: { type: "spring", duration: 0.34, bounce: 0.1 },
  /** Press and release feedback on tactile controls. */
  tactile: { type: "spring", duration: 0.3, bounce: 0.15 },
  /** Pointer-following values (magnetic buttons). */
  follow: { type: "spring", stiffness: 300, damping: 30, mass: 0.6 },
  /** Smoothing scroll progress so scrubbed values do not step. */
  scroll: { type: "spring", stiffness: 140, damping: 28, mass: 0.4, restDelta: 0.001 },
} satisfies Record<string, Transition>;

/* Shared layoutId names, so two components never collide */

export const LAYOUT_ID = {
  navPill: "nav-active-pill",
  skuPill: "active-sku-pill",
  checkoutBar: "checkout-active-bar",
  catalogChip: "catalog-active-chip",
} as const;

/* Variants */

export const VIEWPORT_ONCE = { once: true, margin: "0px 0px -12% 0px" } as const;

export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: TRANSITION.enter },
};

export const fadeUp = (distance = 16): Variants => ({
  hidden: { opacity: 0, y: distance },
  visible: { opacity: 1, y: 0, transition: TRANSITION.enter },
});

/** clip-path is the one non-transform property allowed for reveals. */
export const maskReveal: Variants = {
  hidden: { clipPath: "inset(0 0 100% 0)" },
  visible: { clipPath: "inset(0 0 0% 0)", transition: { duration: DUR.reveal, ease: EASE.inOut } },
};

export const staggerContainer = (stagger = STAGGER, delayChildren = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren } },
});

/* Legacy exports, kept so existing imports compile. Values now follow the tokens above. */

export const EDITORIAL_EASE = EASE.out;
export const SPRING_TACTILE = SPRING.tactile;
export const SPRING_DRAWER = SPRING.drawer;

export const HERO_REVEAL = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: DUR.reveal, delay, ease: EASE.out },
  }),
};

export const STAGGER_LIST = {
  hidden: {},
  visible: { transition: { staggerChildren: STAGGER } },
};

export const STAGGER_ITEM = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: TRANSITION.enter },
};

/* Motion policy: reduced motion and hover capability, read once, shared everywhere */

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
const HOVER_QUERY = "(hover: hover) and (pointer: fine)";

function queryStore(query: string, fallback: boolean) {
  return {
    subscribe(listener: () => void) {
      const list = window.matchMedia(query);
      list.addEventListener("change", listener);
      return () => list.removeEventListener("change", listener);
    },
    get: () => window.matchMedia(query).matches,
    server: () => fallback,
  };
}

const reducedStore = queryStore(REDUCED_QUERY, true);
const hoverStore = queryStore(HOVER_QUERY, false);

export const subscribeReducedMotion = reducedStore.subscribe;
export const getReducedMotion = reducedStore.get;

export function useReducedMotionPreference(): boolean {
  return useSyncExternalStore(reducedStore.subscribe, reducedStore.get, reducedStore.server);
}

/** True only for a mouse or trackpad. Gate hover motion on this; touch fires false hovers. */
export function useHoverCapable(): boolean {
  return useSyncExternalStore(hoverStore.subscribe, hoverStore.get, hoverStore.server);
}

export function useMotionPolicy() {
  const reduced = useReducedMotionPreference();
  const canHover = useHoverCapable();
  return useMemo(() => ({ reduced, canHover, animateHover: canHover && !reduced }), [reduced, canHover]);
}

/* Scroll hooks */

type ScrollOffset = NonNullable<NonNullable<Parameters<typeof useScroll>[0]>["offset"]>;

/** 0 to 1 as `target` travels through the viewport. */
export function useScrollProgress(
  target: RefObject<HTMLElement | null>,
  offset: ScrollOffset = ["start end", "end start"],
): MotionValue<number> {
  return useScroll({ target, offset }).scrollYProgress;
}

/** Spring-smoothed progress. Returns the raw value under reduced motion. */
export function useSmoothProgress(progress: MotionValue<number>): MotionValue<number> {
  const reduced = useReducedMotionPreference();
  const smooth = useSpring(progress, SPRING.scroll);
  return reduced ? progress : smooth;
}

/** Maps progress to a range. Under reduced motion the value stays at `from`. */
export function useScrollRange<T extends number | string>(
  progress: MotionValue<number>,
  from: T,
  to: T,
): MotionValue<T> {
  const reduced = useReducedMotionPreference();
  return useTransform(progress, [0, 1], reduced ? [from, from] : [from, to]);
}

/** Symmetric vertical parallax of +/- `distance` px across the progress range. */
export function useParallax(progress: MotionValue<number>, distance: number): MotionValue<number> {
  return useScrollRange(progress, -distance, distance);
}

/**
 * Header compression state with hysteresis, so it never flickers at the threshold.
 * Compacts below `threshold + 8` scrolled px, expands again under `threshold - 8`.
 */
export function useHeaderCompaction(threshold = 24): boolean {
  const { scrollY } = useScroll();
  const [compact, setCompact] = useState(() => typeof window !== "undefined" && window.scrollY > threshold);
  useMotionValueEvent(scrollY, "change", (y) => {
    setCompact((was) => (was ? y > threshold - 8 : y > threshold + 8));
  });
  return compact;
}

import type { ReactNode } from "react";
import { motion } from "motion/react";
import {
  TRANSITION,
  VIEWPORT_ONCE,
  fadeUp,
  maskReveal,
  staggerContainer,
  STAGGER,
  useReducedMotionPreference,
} from "../../lib/motion";

const TAGS = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  header: motion.header,
  li: motion.li,
  ul: motion.ul,
  p: motion.p,
} as const;

type Tag = keyof typeof TAGS;

interface BaseProps {
  children: ReactNode;
  className?: string;
  as?: Tag;
}

interface RevealProps extends BaseProps {
  /** Travel distance in px. Zero under reduced motion. */
  distance?: number;
  /** Seconds. Prefer Stagger for groups. */
  delay?: number;
}

/** Fades and lifts into place once, when scrolled into view. */
export function Reveal({ children, className, as = "div", distance = 16, delay = 0 }: RevealProps) {
  const reduced = useReducedMotionPreference();
  const Component = TAGS[as] as typeof motion.div;
  const rise = reduced ? 0 : distance;
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y: rise }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT_ONCE}
      transition={{ ...TRANSITION.enter, delay }}
    >
      {children}
    </Component>
  );
}

interface StaggerProps extends BaseProps {
  /** Seconds between children. Keep within 0.03 to 0.08. */
  stagger?: number;
  delayChildren?: number;
}

/** Container that staggers its StaggerItem children in once. */
export function Stagger({ children, className, as = "div", stagger = STAGGER, delayChildren = 0 }: StaggerProps) {
  const Component = TAGS[as] as typeof motion.div;
  return (
    <Component
      className={className}
      variants={staggerContainer(stagger, delayChildren)}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_ONCE}
    >
      {children}
    </Component>
  );
}

interface StaggerItemProps extends BaseProps {
  distance?: number;
}

export function StaggerItem({ children, className, as = "div", distance = 16 }: StaggerItemProps) {
  const reduced = useReducedMotionPreference();
  const Component = TAGS[as] as typeof motion.div;
  return (
    <Component className={className} variants={fadeUp(reduced ? 0 : distance)}>
      {children}
    </Component>
  );
}

/** Wipes content in from the top with a clip-path. For images and large media. */
export function MaskReveal({ children, className, as = "div" }: BaseProps) {
  const reduced = useReducedMotionPreference();
  const Component = TAGS[as] as typeof motion.div;
  if (reduced) {
    return (
      <Component className={className} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={VIEWPORT_ONCE} transition={TRANSITION.enter}>
        {children}
      </Component>
    );
  }
  return (
    <Component className={className} variants={maskReveal} initial="hidden" whileInView="visible" viewport={VIEWPORT_ONCE}>
      {children}
    </Component>
  );
}

import { useRef, type PointerEvent, type ReactNode } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { SPRING, useMotionPolicy } from "../../lib/motion";

interface MagneticProps {
  children: ReactNode;
  className?: string;
  /** Fraction of the pointer offset the element follows. */
  strength?: number;
  /** Maximum travel in px on each axis. */
  limit?: number;
}

/**
 * Nudges a single control toward the pointer. Reserve it for one primary action
 * per page (the hero call to action). Mouse only: touch and reduced motion get a plain wrapper.
 */
export function Magnetic({ children, className, strength = 0.2, limit = 10 }: MagneticProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const { animateHover } = useMotionPolicy();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, SPRING.follow);
  const springY = useSpring(y, SPRING.follow);

  if (!animateHover) {
    return <span className={className} style={{ display: "inline-flex" }}>{children}</span>;
  }

  const clamp = (value: number) => Math.max(-limit, Math.min(limit, value));

  const onPointerMove = (event: PointerEvent<HTMLSpanElement>) => {
    if (event.pointerType !== "mouse" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set(clamp((event.clientX - (rect.left + rect.width / 2)) * strength));
    y.set(clamp((event.clientY - (rect.top + rect.height / 2)) * strength));
  };

  const release = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.span
      ref={ref}
      className={className}
      style={{ display: "inline-flex", x: springX, y: springY }}
      onPointerMove={onPointerMove}
      onPointerLeave={release}
      onPointerCancel={release}
    >
      {children}
    </motion.span>
  );
}

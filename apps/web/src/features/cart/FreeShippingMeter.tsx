import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Truck } from 'lucide-react';
import { EASE, TRANSITION } from '../../lib/motion';

interface FreeShippingMeterProps {
  subtotal: number;
  /** Cart value that unlocks free shipping. Omit when the store has no such rule. */
  threshold?: number;
}

const rupees = (value: number) => '₹' + value.toLocaleString('en-IN');

export function FreeShippingMeter({ subtotal, threshold }: FreeShippingMeterProps) {
  const valid = !!threshold && threshold > 0;
  const progress = valid ? Math.min(1, Math.max(0, subtotal / threshold)) : 0;
  const complete = valid && progress >= 1;
  const wasComplete = useRef(complete);
  const [justUnlocked, setJustUnlocked] = useState(false);

  // Celebrate once, when the cart crosses the threshold, never on first render.
  useEffect(() => {
    if (complete && !wasComplete.current) {
      setJustUnlocked(true);
      const timer = window.setTimeout(() => setJustUnlocked(false), 1600);
      wasComplete.current = complete;
      return () => window.clearTimeout(timer);
    }
    wasComplete.current = complete;
  }, [complete]);

  if (!valid) return <p className="shipping-meter shipping-meter__note">Delivery cost depends on the carrier you pick at checkout.</p>;

  const remaining = Math.max(0, threshold - subtotal);

  return (
    <div className="shipping-meter" data-complete={complete || undefined}>
      <p className="shipping-meter__label" role="status">
        <span className="shipping-meter__icon" aria-hidden="true">
          <AnimatePresence mode="wait" initial={false}>
            {complete
              ? <motion.span key="done" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={TRANSITION.ui}><Check size={15} /></motion.span>
              : <motion.span key="truck" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={TRANSITION.hover}><Truck size={15} strokeWidth={1.75} /></motion.span>}
          </AnimatePresence>
        </span>
        {complete
          ? <span>Free shipping unlocked.</span>
          : <span>Add <strong className="tnum">{rupees(remaining)}</strong> for free shipping.</span>}
      </p>
      <div className="shipping-meter__track" role="progressbar" aria-label="Progress toward free shipping"
        aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
        <motion.div className="shipping-meter__fill" initial={false} animate={{ scaleX: progress }} transition={TRANSITION.reveal} />
        <AnimatePresence>
          {justUnlocked && <motion.div className="shipping-meter__flash" initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.9, ease: EASE.out }} />}
        </AnimatePresence>
      </div>
    </div>
  );
}

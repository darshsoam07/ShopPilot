// apps/web/src/features/cart/FreeShippingMeter.tsx
import { motion } from "motion/react";
import { Truck } from "lucide-react";
import { EDITORIAL_EASE } from "../../lib/motion";

interface FreeShippingMeterProps {
  subtotal: number;
  threshold?: number;
}

export function FreeShippingMeter({ subtotal, threshold }: FreeShippingMeterProps) {
  if (!threshold || threshold <= 0) return <div className="shipping-meter">Delivery price depends on the carrier selected at checkout.</div>;
  const progress = Math.min(1, Math.max(0, subtotal / threshold));
  const remaining = Math.max(0, threshold - subtotal);

  return (
    <div className="shipping-meter">
      <div className="shipping-meter__label">
        <Truck size={15} strokeWidth={1.75} />
        {remaining === 0 ? (
          <span>You’ve unlocked complimentary express shipping.</span>
        ) : (
          <span>
            Add <strong className="font-mono-tabular">₹{remaining.toLocaleString("en-IN")}</strong>{" "}
            more for complimentary shipping.
          </span>
        )}
      </div>
      <div className="shipping-meter__track" role="progressbar" aria-label="Progress toward free shipping" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
        <motion.div
          className="shipping-meter__fill"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress }}
          transition={{ duration: 0.45, ease: EDITORIAL_EASE }}
        />
      </div>
    </div>
  );
}

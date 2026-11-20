// apps/web/src/features/orders/CheckoutStepper.tsx
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { SPRING_TACTILE } from "../../lib/motion";

export interface CheckoutStep {
  id: number;
  label: string;
}

const STEPS: CheckoutStep[] = [
  { id: 0, label: "Account" }, // Completed via ProtectedRoute
  { id: 1, label: "Shipping" },
  { id: 2, label: "Payment" },
  { id: 3, label: "Review" },
];

interface CheckoutStepperProps {
  currentStep: 1 | 2 | 3;
  onStepSelect?: (step: 1 | 2 | 3) => void;
}

export function CheckoutStepper({ currentStep, onStepSelect }: CheckoutStepperProps) {
  return (
    <nav className="checkout-stepper" aria-label="Checkout progress">
      <ol className="checkout-stepper__list">
        {STEPS.map((step) => {
          const isCompleted = step.id < currentStep;
          const isActive = step.id === currentStep;
          const isClickable = step.id > 0 && step.id < currentStep && Boolean(onStepSelect);

          return (
            <li key={step.id} className="checkout-stepper__item">
              <button
                type="button"
                aria-current={isActive ? "step" : undefined}
                disabled={!isClickable}
                onClick={() => isClickable && onStepSelect?.(step.id as 1 | 2 | 3)}
                className={`checkout-step ${isActive ? "is-active" : ""} ${
                  isCompleted ? "is-completed" : ""
                }`}
              >
                <span className="checkout-step__num font-mono-tabular">
                  {isCompleted ? <Check size={12} strokeWidth={2.5} /> : `0${step.id}`}
                </span>
                <span className="checkout-step__label">{step.label}</span>
                {isActive && (
                  <motion.span
                    layoutId="checkout-active-bar"
                    transition={SPRING_TACTILE}
                    className="checkout-step__underline"
                  />
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}


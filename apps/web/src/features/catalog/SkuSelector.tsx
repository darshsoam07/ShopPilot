// apps/web/src/features/catalog/SkuSelector.tsx
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ShoppingBag } from "lucide-react";
import { SPRING_TACTILE } from "../../lib/motion";

export interface ProductVariant {
  id: string | number;
  sku?: string;
  label: string;
  price: number;
  stock: number;
}

interface SkuSelectorProps {
  variants: ProductVariant[];
  activeVariant: ProductVariant;
  onSelect?: (variant: ProductVariant) => void;
  onAddToBag: (variant: ProductVariant) => void;
  isAdding?: boolean;
  signedIn: boolean;
  invalidQuantity: boolean;
}

export function SkuSelector({
  variants,
  activeVariant,
  onSelect,
  onAddToBag,
  isAdding = false, signedIn, invalidQuantity,
}: SkuSelectorProps) {
  const navigate = useNavigate();
  const outOfStock = activeVariant.stock <= 0;

  const handlePick = (variant: ProductVariant) => {
    if (variant.id === activeVariant.id) return;
    onSelect?.(variant);
    navigate(`/products/${variant.id}`, { replace: true });
  };

  return (
    <div className="sku-selector">
      <div className="sku-selector__header">
        <span className="sku-selector__label">Configuration</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={activeVariant.id}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.16 }}
            className="sku-selector__status font-mono-tabular"
          >
            {activeVariant.sku ? `${activeVariant.sku} · ` : ""}
            <span className={activeVariant.stock > 5 ? "status-in-stock" : "status-low-stock"}>
              {outOfStock ? "Sold Out" : `${activeVariant.stock} in stock`}
            </span>
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="sku-grid" role="group" aria-label="Product variants">
        {variants.map((variant) => {
          const isSelected = variant.id === activeVariant.id;
          return (
            <button
              key={variant.id}
              type="button"
              
              aria-pressed={isSelected}
              onClick={() => handlePick(variant)}
              className={`sku-pill ${isSelected ? "is-selected" : ""}`}
            >
              {isSelected && (
                <motion.span
                  layoutId="active-sku-pill"
                  transition={SPRING_TACTILE}
                  className="sku-pill__bg"
                />
              )}
              <span className="sku-pill__content">
                <span className="sku-pill__name">{variant.label}</span>
                <span className="sku-pill__price font-mono-tabular">
                  ₹{variant.price.toLocaleString("en-IN")}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <motion.button
        type="button"
        disabled={outOfStock || isAdding || invalidQuantity}
        whileTap={outOfStock ? undefined : { scale: 0.98 }}
        onClick={() => onAddToBag(activeVariant)}
        className="btn-primary sku-selector__cta"
      >
        <span className="sku-selector__cta-left">
          <ShoppingBag size={16} />
          {outOfStock ? "Out of Stock" : isAdding ? "Adding..." : signedIn ? "Add to Bag" : "Sign in to add to bag"}
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={activeVariant.price}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.18 }}
            className="font-mono-tabular"
          >
            ₹{activeVariant.price.toLocaleString("en-IN")}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

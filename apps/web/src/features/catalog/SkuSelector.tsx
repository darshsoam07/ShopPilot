import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { LAYOUT_ID, SPRING, TRANSITION } from '../../lib/motion';

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
  /** Runs before navigation so the page can prime its cache and focus target. */
  onSelect?: (variant: ProductVariant) => void;
}

const rupees = (value: number) => '₹' + value.toLocaleString('en-IN');

/**
 * Variants are real links, one URL each, so they work with middle-click, keyboard and assistive tech.
 * A single variant renders nothing. The active indicator glides between options on one shared layoutId.
 */
export function SkuSelector({ variants, activeVariant, onSelect }: SkuSelectorProps) {
  const navigate = useNavigate();
  const outOfStock = activeVariant.stock <= 0;
  const unique = variants.filter((variant, index) => variants.findIndex(other => other.id === variant.id) === index);

  return (
    <div className="sku-selector">
      <p className="sku-selector__status">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={activeVariant.id + ':' + outOfStock} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={TRANSITION.hover}
            className={outOfStock ? 'status-out-of-stock' : activeVariant.stock > 5 ? 'status-in-stock' : 'status-low-stock'}>
            {outOfStock ? 'Sold out' : `${activeVariant.stock} in stock`}
          </motion.span>
        </AnimatePresence>
      </p>

      {unique.length > 1 && (
        <LayoutGroup id="sku-options">
          <fieldset className="sku-options">
            <legend>Configuration</legend>
            {unique.map(variant => {
              const active = variant.id === activeVariant.id;
              const soldOut = variant.stock <= 0;
              return (
                <Link key={variant.id} to={`/products/${variant.id}`} replace aria-current={active ? 'page' : undefined}
                  data-sold-out={soldOut || undefined}
                  onClick={event => {
                    event.preventDefault();
                    if (active) return;
                    onSelect?.(variant);
                    navigate(`/products/${variant.id}`, { replace: true });
                  }}>
                  {active && <motion.span layoutId={LAYOUT_ID.skuPill} className="sku-options__pill" transition={SPRING.indicator} aria-hidden="true" />}
                  <span className="sku-options__label">{variant.label}</span>
                  <span className="sku-options__meta tnum">{soldOut ? 'Sold out' : rupees(variant.price)}</span>
                </Link>
              );
            })}
          </fieldset>
        </LayoutGroup>
      )}
    </div>
  );
}

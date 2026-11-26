import { motion } from 'motion/react';
import { STAGGER, TRANSITION } from '../../lib/motion';
import { dedupeById } from './dedupe';
import { ProductCard } from './ProductCard';
import type { Product } from './types';

interface ProductGridProps {
  products: Product[];
  view?: 'grid' | 'list';
  /** Four columns from 1100px. Use when the grid is not beside a sidebar. */
  wide?: boolean;
  /** Dims the grid while the next result set loads. */
  stale?: boolean;
  /** The first card is the largest contentful paint on pages with no hero. */
  prioritizeFirst?: boolean;
}

/** Cards enter once, staggered by column position. Cards that persist across filters do not re-animate. */
export function ProductGrid({ products, view = 'grid', wide = false, stale = false, prioritizeFirst = false }: ProductGridProps) {
  return (
    <div className="product-grid" data-view={view} data-wide={wide || undefined} data-stale={stale || undefined}>
      {dedupeById(products).map((product, index) => (
        <motion.div key={product.id} className="product-grid__cell"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ ...TRANSITION.enter, delay: Math.min(index, 7) * STAGGER }}>
          <ProductCard product={product} priority={prioritizeFirst && index === 0} />
        </motion.div>
      ))}
    </div>
  );
}

/** Same geometry as a real card, so nothing shifts when data arrives. */
export function ProductGridSkeleton({ count = 6, wide = false, view = 'grid' }: { count?: number; wide?: boolean; view?: 'grid' | 'list' }) {
  return (
    <div className="product-grid" data-view={view} data-wide={wide || undefined} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div className="product-card product-card--skeleton" key={index}>
          <div className="product-card__media"><div className="product-image-wrap skeleton" /></div>
          <div className="skeleton product-card__skeleton-line" />
          <div className="skeleton product-card__skeleton-line product-card__skeleton-line--short" />
        </div>
      ))}
    </div>
  );
}

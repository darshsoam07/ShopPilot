import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { MaskReveal, Reveal } from '../../components/motion/Reveal';
import { useScrollProgress, useScrollRange } from '../../lib/motion';
import { getProducts } from './api';
import { ProductImage } from './ProductImage';
import { resolveProductMedia } from './productMedia';

interface StorefrontCampaignProps {
  featuredSku?: string;
  /** The home page already owns the h1, so it passes 2. Standalone mounts keep 1. */
  headingLevel?: 1 | 2 | 3;
}

/**
 * One featured product, told in three beats beside a pinned photograph.
 * Layout is CSS only (sticky column); the photograph itself is the only scroll-linked element.
 */
export function StorefrontCampaign({ featuredSku = 'AUD-NOVA-001', headingLevel = 1 }: StorefrontCampaignProps) {
  const query = useQuery({ queryKey: ['campaign', featuredSku], queryFn: () => getProducts('q=' + encodeURIComponent(featuredSku)) });
  const product = query.data?.items.find(item => item.sku === featuredSku);
  const ref = useRef<HTMLElement>(null);
  const progress = useScrollProgress(ref, ['start end', 'end start']);
  const scale = useScrollRange(progress, 1.12, 1);
  const y = useScrollRange(progress, '-4%', '4%');
  const Heading = `h${headingLevel}` as 'h1' | 'h2' | 'h3';
  const specs = Object.entries(product?.specifications ?? {});

  return (
    <section ref={ref} className="campaign band" aria-labelledby="campaign-title">
      <div className="container-editorial campaign__grid">
        <div className="campaign__stage">
          <MaskReveal className="campaign-art">
            <motion.div className="campaign-art__inner" style={{ scale, y }}>
              {product
                ? <ProductImage url={resolveProductMedia(product).primary} name={product.name} />
                : <span>Studio audio</span>}
            </motion.div>
          </MaskReveal>
        </div>

        <div className="campaign__story">
          <Reveal className="campaign__beat">
            <Heading id="campaign-title" className="campaign__title">{product?.name ?? 'Studio audio'}</Heading>
            {product && <p className="campaign__lead">{product.description}</p>}
            <Link className="text-link" to="/products?categories=Audio">Explore audio <ArrowUpRight size={15} aria-hidden="true" /></Link>
          </Reveal>

          {specs.length > 0 && (
            <Reveal className="campaign__beat">
              <h3 className="campaign__subhead">Specifications</h3>
              <dl className="campaign__specs">
                {specs.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
              </dl>
            </Reveal>
          )}

          {product && (
            <Reveal className="campaign__beat">
              <div className="purchase-strip">
                <div>
                  <small className="purchase-strip__sku">{[product.sku, product.specifications?.Configuration].filter(Boolean).join(' · ')}</small>
                  <strong className="price tnum">₹{Number(product.price).toLocaleString('en-IN')}</strong>
                </div>
                <Link className="btn-primary" to={`/products/${product.id}`}>View configuration</Link>
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}

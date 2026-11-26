import { Link } from 'react-router-dom';
import { useId } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Check, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getJson } from '../../services/http';
import { useAddToCart } from '../cart/useAddToCart';
import { ProductImage, resolveImageSrc } from './ProductImage';
import { dedupeById } from './dedupe';
import { resolveProductMedia } from './productMedia';
import type { Product } from './types';

/** Finish names the catalogue is known to use. Anything else falls back to a lettered chip. */
const FINISH_TONES: Record<string, string> = {
  obsidian: '#1B1A17',
  alabaster: '#E9E4D8',
};

const rupees = (value: string) => '₹' + Number(value).toLocaleString('en-IN');

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const titleId = useId();
  const { isAuthenticated } = useAuth();
  const family = useQuery({
    queryKey: ['variants', String(product.id)],
    queryFn: () => getJson<Product[]>('/api/v1/products/' + product.id + '/variants'),
    enabled: !!product.family,
  });
  const add = useAddToCart(product.id);
  const chooseOption = !!product.family && family.data?.length !== 1;
  const inStock = product.stock_quantity > 0;
  const target = '/products/' + product.id;
  const media = resolveProductMedia(product);
  const secondary = media.gallery[1];
  const variants = family.data && family.data.length > 1 ? dedupeById(family.data) : [];

  return (
    <article className="product-card" data-sold-out={inStock ? undefined : 'true'}>
      <div className="product-card__media">
        <div className="product-image-wrap">
          <Link className="product-card__link" to={target} aria-label={'View ' + product.name}>
            <ProductImage url={media.primary} name={product.name} priority={priority} />
            {media.primary && secondary && (
              <span className="product-card__alt" aria-hidden="true"
                style={{ backgroundImage: `url("${resolveImageSrc(secondary)}")` }} />
            )}
          </Link>
          {!inStock && <span className="product-card__tag">Sold out</span>}
        </div>
        <div className="product-card__tray">
          {chooseOption ? (
            <Link to={target} className="product-card__action" aria-describedby={titleId}>
              Choose option <ArrowRight size={14} aria-hidden="true" />
            </Link>
          ) : !isAuthenticated && inStock ? (
            <Link to="/login" className="product-card__action" aria-describedby={titleId}>Sign in to add to cart</Link>
          ) : (
            <button type="button" className="product-card__action" aria-describedby={titleId}
              disabled={!inStock || add.isPending} onClick={() => add.mutate()}>
              {add.isSuccess ? <Check size={14} aria-hidden="true" /> : <Plus size={14} aria-hidden="true" />}
              {!inStock ? 'Sold out' : add.isPending ? 'Adding…' : add.isSuccess ? 'Added to cart' : 'Add to cart'}
            </button>
          )}
        </div>
      </div>

      <div className="product-card__meta">
        <h3 className="product-card__title" id={titleId}><Link to={target}>{product.name}</Link></h3>
        <p className="product-card__price price tnum">{rupees(product.price)}</p>
      </div>
      <p className="product-card__sub">
        <span>{product.category}</span>
        <span className="product-card__sku">{product.sku}</span>
      </p>

      {variants.length > 0 && (
        <ul className="product-card__swatches" aria-label="Finishes">
          {variants.map(variant => {
            const finish = variant.specifications?.Finish ?? variant.name;
            const tone = FINISH_TONES[finish.toLowerCase()];
            return (
              <li key={variant.id}>
                <Link to={'/products/' + variant.id} className="swatch" title={finish} aria-label={finish}
                  aria-current={variant.id === product.id ? 'true' : undefined}
                  style={tone ? { backgroundColor: tone } : undefined}>
                  {!tone && <span aria-hidden="true">{finish[0]}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <span className="sr-only" role="status">{add.isSuccess ? 'Added to cart' : ''}</span>
      {add.isError && <p className="product-card__error" role="alert">{add.error.message}</p>}
    </article>
  );
}

import { useRef, useState, type RefObject } from 'react';
import { Link, useNavigate, useNavigationType, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bookmark, Share2 } from 'lucide-react';
import { Reveal } from '../../components/motion/Reveal';
import { useAuth } from '../../context/AuthContext';
import { getJson } from '../../services/http';
import { useCartDrawer } from '../cart/CartDrawerContext';
import { useAddToCart } from '../cart/useAddToCart';
import { getProducts } from './api';
import { dedupeById } from './dedupe';
import { ProductGrid } from './ProductGrid';
import { ProductImage } from './ProductImage';
import { ProductReviewsSection } from './ProductReviewsSection';
import { resolveProductMedia, selectedProductImage } from './productMedia';
import { SkuSelector, type ProductVariant } from './SkuSelector';
import type { Product } from './types';

const rupees = (value: string | number) => '₹' + Number(value).toLocaleString('en-IN');

function option(product: Product): ProductVariant {
  const spec = product.specifications;
  return {
    id: product.id, sku: product.sku, price: Number(product.price), stock: product.stock_quantity,
    label: [spec.Configuration, spec.Finish, spec.Protection !== 'None' && spec.Protection].filter(Boolean).join(' · ') || product.sku,
  };
}

export function ProductDetailPage({ openAssistant }: { openAssistant: () => void }) {
  const { productId } = useParams();
  const focusTarget = useRef<number | null>(null);
  return <ProductExperience focusTarget={focusTarget} key={productId} productId={productId!} openAssistant={openAssistant} />;
}

function PdpSkeleton() {
  // Deliberately not using .detail-layout, .gallery-stage or .pdp-purchase, which are the loaded page's hooks.
  return (
    <section className="catalog-section product-reference" role="status" aria-label="Loading product">
      <div className="pdp-skeleton" aria-hidden="true">
        <div className="pdp-skeleton__media skeleton" />
        <div className="pdp-skeleton__panel">
          <div className="skeleton pdp-skeleton-line" /><div className="skeleton pdp-skeleton-title" />
          <div className="skeleton pdp-skeleton-line" /><div className="skeleton pdp-skeleton-block" />
        </div>
      </div>
    </section>
  );
}

function ProductExperience({ productId, openAssistant, focusTarget }: { focusTarget: RefObject<number | null>; productId: string; openAssistant: () => void }) {
  const navigation = useNavigationType();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { openDrawer } = useCartDrawer();
  const client = useQueryClient();
  const [selected, setSelected] = useState('');
  const [shared, setShared] = useState('');
  const [saved, setSaved] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem('saved-products') || '[]'); } catch { return []; }
  });
  const [quantity, setQuantity] = useState(1);
  const detail = useQuery({ queryKey: ['product', productId], queryFn: () => getJson<Product>('/api/v1/products/' + productId) });
  const related = useQuery({ queryKey: ['products', 'related'], queryFn: () => getProducts('limit=4&in_stock=true') });
  const variants = useQuery({ queryKey: ['variants', productId], queryFn: () => getJson<Product[]>('/api/v1/products/' + productId + '/variants') });
  const add = useAddToCart(detail.data?.id ?? 0);

  if (detail.isPending) return <PdpSkeleton />;
  if (!detail.data) {
    return (
      <section className="state-panel error-state" role="alert">
        <strong>Couldn’t load this product.</strong>
        <span>{detail.error?.message ?? 'Check your connection and try again.'}</span>
        <span><button type="button" onClick={() => detail.refetch()}>Retry</button> <Link to="/products">Browse the collection</Link></span>
      </section>
    );
  }

  const p = detail.data;
  const { gallery } = resolveProductMedia(p);
  const image = selectedProductImage(gallery, selected);
  const outOfStock = p.stock_quantity <= 0;
  const canPurchase = Number.isInteger(quantity) && quantity >= 1 && quantity <= p.stock_quantity && !add.isPending;
  const isSaved = saved.includes(p.id);
  const options = dedupeById(variants.data ?? [p]).map(option);
  const others = dedupeById(related.data?.items ?? []).filter(item => item.id !== p.id);

  const toggleSaved = () => {
    const next = isSaved ? saved.filter(id => id !== p.id) : [...saved, p.id];
    setSaved(next);
    try { localStorage.setItem('saved-products', JSON.stringify(next)); } catch { /* storage unavailable */ }
  };

  return (
    <section className="catalog-section product-reference">
      <nav aria-label="Breadcrumb" className="pdp-crumbs"><Link to="/">Home</Link><span aria-hidden="true">/</span><Link to="/products">Collection</Link><span aria-hidden="true">/</span><span aria-current="page">{p.name}</span></nav>

      <article className="detail-layout">
        <div className="pdp-gallery">
          <div className="gallery-stage">
            <ProductImage url={image} name={p.name} priority />
            <div className="gallery-actions">
              <button type="button" aria-label="Save product" aria-pressed={isSaved} onClick={toggleSaved}>
                <Bookmark size={15} aria-hidden="true" fill={isSaved ? 'currentColor' : 'none'} />{isSaved ? 'Saved' : 'Save'}
              </button>
              <button type="button" onClick={async () => {
                try { await navigator.clipboard.writeText(location.href); setShared('Link copied'); } catch { setShared('Copy the address from your browser'); }
              }}><Share2 size={15} aria-hidden="true" />Share</button>
            </div>
          </div>
          {gallery.length > 1 && (
            <div className="gallery-thumbs">
              {gallery.map((url, i) => (
                <button type="button" key={`${i}:${url}`} aria-label={`View image ${i + 1} of ${gallery.length}`} aria-pressed={url === image} onClick={() => setSelected(url)}>
                  <ProductImage url={url} name={p.name + ', view ' + (i + 1)} />
                </button>
              ))}
            </div>
          )}
          <small role="status" className="pdp-share-status">{shared}</small>
        </div>

        <div className="pdp-purchase">
          <small>{p.brand ?? p.category} · {p.sku}</small>
          <h1 tabIndex={-1} ref={node => {
            if (node && focusTarget.current === p.id) {
              focusTarget.current = null;
              if (navigation === 'PUSH' || navigation === 'REPLACE') node.focus();
            }
          }}>{p.name}</h1>
          <strong className="price tnum">{rupees(p.price)}</strong>
          {p.rating && <p className="pdp-rating tnum">★ {p.rating} · {p.review_count} {p.review_count === 1 ? 'review' : 'reviews'}</p>}
          <p className="pdp-description">{p.description}</p>

          <SkuSelector variants={options} activeVariant={option(p)}
            onSelect={variant => {
              const next = variants.data?.find(item => item.id === variant.id);
              if (!next) return;
              focusTarget.current = next.id;
              client.setQueryData(['product', String(next.id)], next);
              client.setQueryData(['variants', String(next.id)], variants.data);
              setSelected('');
              setQuantity(1);
              add.reset();
            }} />

          <form className="pdp-buy" onSubmit={event => {
            event.preventDefault();
            if (!isAuthenticated) { navigate('/login'); return; }
            if (canPurchase && !outOfStock) add.mutate(quantity);
          }}>
            <label>Quantity
              <input type="number" required min={1} max={Math.max(1, p.stock_quantity)} value={quantity} disabled={outOfStock}
                onChange={event => setQuantity(Number(event.target.value))} />
            </label>
            <button type="submit" className="btn-primary" disabled={isAuthenticated && (outOfStock || !canPurchase)}>
              {add.isPending ? 'Adding…' : isAuthenticated ? 'Add to cart' : 'Sign in to add to cart'}
            </button>
          </form>

          <p role="status" className="pdp-status tnum">{add.error?.message ?? (add.isSuccess ? 'Added to cart' : '')}</p>
          {add.isSuccess && <button type="button" className="text-link pdp-view-cart" onClick={openDrawer}>View cart</button>}
          <button type="button" className="text-link" onClick={openAssistant}>Compare with ShopPilot</button>
          <p className="pdp-delivery">Select a delivery carrier at checkout.</p>
        </div>
      </article>

      {Object.keys(p.specifications).length > 0 && (
        <Reveal as="section" className="pdp-specs">
          <h2>Technical specifications</h2>
          <dl className="spec-tiles">
            {Object.entries(p.specifications).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}
          </dl>
        </Reveal>
      )}

      <ProductReviewsSection key={p.id} productId={p.id} />

      {others.length > 0 && (
        <section className="pdp-related">
          <h2>More to explore</h2>
          <ProductGrid products={others} />
        </section>
      )}
    </section>
  );
}

import { ProductCard } from './ProductCard';
import './productDetail.css';
import { ProductImage } from './ProductImage';
import { resolveProductMedia, selectedProductImage } from './productMedia';
import { ProductReviewsSection } from "./ProductReviewsSection";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState, type RefObject } from 'react';
import { Link, useParams, useNavigationType } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getJson } from '../../services/http';
import { addCartItem } from '../cart/api';
import { getProducts } from './api';
import type { Product } from './types';

export function ProductDetailPage({ openAssistant }: { openAssistant: () => void }) {
  const { productId } = useParams();
  const focusTarget = useRef<number | null>(null);
  return <ProductExperience focusTarget={focusTarget} key={productId} productId={productId!} openAssistant={openAssistant} />;
}

function ProductExperience({ productId, openAssistant, focusTarget }: { focusTarget: RefObject<number | null>; productId: string; openAssistant: () => void }) {
  const navigation = useNavigationType();
  const { isAuthenticated } = useAuth();
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
  const add = useMutation({ mutationFn: (item: { productId: number; quantity: number }) => addCartItem(item.productId, item.quantity),
    onSuccess: cart => client.setQueryData(['cart'], cart) });
  if (!detail.data) return <section className="state-panel">{detail.error?.message ?? 'Loading product…'} <Link to="/">Browse catalogue</Link></section>;
  const p = detail.data;
  const { gallery } = resolveProductMedia(p);
  const image = selectedProductImage(gallery, selected);
  const canPurchase = Number.isInteger(quantity) && quantity >= 1 && quantity <= p.stock_quantity && !add.isPending;
  return <section className="catalog-section product-reference">
    <nav aria-label="Breadcrumb"><Link to="/">Home</Link> / <Link to="/products">Collection</Link> / {p.name}</nav>
    <article className="detail-layout">
      <div><div className="gallery-stage"><ProductImage url={image} name={p.name} priority />
        <div className="gallery-actions"><button aria-label="Save product" aria-pressed={saved.includes(p.id)} onClick={() => {
          const next = saved.includes(p.id) ? saved.filter(id => id !== p.id) : [...saved,p.id];
          setSaved(next); localStorage.setItem('saved-products', JSON.stringify(next));
        }}>{saved.includes(p.id) ? 'Saved' : 'Save'}</button><button onClick={async () => { try { await navigator.clipboard.writeText(location.href); setShared('Link copied'); } catch { setShared('Copy the address from your browser'); } }}>Share</button></div></div>
        <div className="gallery-thumbs">{gallery.map((url,i) => <button key={url} aria-label={`View image ${i + 1} of ${gallery.length}`} aria-pressed={url === image} onClick={() => setSelected(url)}><ProductImage url={url} name={p.name + ', view ' + (i + 1)} /></button>)}</div><small role="status">{shared}</small></div>
      <div className="pdp-purchase"><small>{p.brand ?? p.category} · {p.sku}</small><h1 tabIndex={-1} ref={node => {
        if (node && focusTarget.current === p.id) {
          focusTarget.current = null;
          if (navigation === 'PUSH') node.focus();
        }
      }}>{p.name}</h1><strong>₹{Number(p.price).toLocaleString('en-IN')}</strong>
      {p.rating && <p>★ {p.rating} ({p.review_count} reviews)</p>}<p>{p.description}</p><p>{p.stock_quantity} in stock</p>
      {variants.data && variants.data.length > 1 && <fieldset className="sku-options"><legend>Configuration, finish & protection</legend>
        {variants.data.map(option => <Link key={option.id} onClick={event => {
          if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && option.id !== p.id) {
            focusTarget.current = option.id;
          }
        }} aria-current={option.id === p.id ? 'page' : undefined} to={'/products/' + option.id}>
          {[option.specifications.Configuration, option.specifications.Finish, option.specifications.Protection !== 'None' && option.specifications.Protection].filter(Boolean).join(' · ')} · ₹{Number(option.price).toLocaleString('en-IN')}
        </Link>)}</fieldset>}
      {isAuthenticated ? <form onSubmit={e => { e.preventDefault(); if (canPurchase) add.mutate({ productId: p.id, quantity }); }}>
        <label>Quantity <input type="number" required min={1} max={p.stock_quantity} value={quantity} onChange={e => setQuantity(Number(e.target.value))} /></label>
        <button className="primary-button" disabled={!canPurchase}>Add to cart</button>
      </form> : <Link className="primary-button" to="/login">Sign in to add to cart</Link>}
      <p role="status">{add.error?.message ?? (add.isSuccess ? 'Added to cart' : '')}</p>
      <button onClick={openAssistant}>Compare with ShopPilot</button>
      <p className="pdp-delivery">Select a delivery carrier at checkout.</p></div>
    </article>
    {Object.keys(p.specifications).length > 0 && <section><h2>Technical specifications</h2><dl className="spec-tiles">{Object.entries(p.specifications).map(([key,value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl></section>}
    <ProductReviewsSection key={p.id} productId={p.id} />
    {related.data?.items.some(item => item.id !== p.id) && <section><h2>More to explore</h2>
      <div className="product-grid">{related.data.items.filter(item => item.id !== p.id).map(item => <ProductCard key={item.id} product={item} />)}</div></section>}
  </section>;
}

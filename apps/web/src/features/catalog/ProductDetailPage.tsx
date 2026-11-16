import { ProductReviewsSection } from "./ProductReviewsSection";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getJson } from '../../services/http';
import { addCartItem } from '../cart/api';
import { getProducts } from './api';
import type { Product } from './types';

export function ProductDetailPage({ openAssistant }: { openAssistant: () => void }) {
  const { productId } = useParams();
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
  const add = useMutation({ mutationFn: () => addCartItem(Number(productId), quantity),
    onSuccess: cart => client.setQueryData(['cart'], cart) });
  if (!detail.data) return <section className="state-panel">{detail.error?.message ?? 'Loading product…'} <Link to="/">Browse catalogue</Link></section>;
  const p = detail.data;
  const gallery = Array.from(new Set([p.image_url, ...p.gallery_images].filter((url): url is string => !!url)));
  const image = gallery.includes(selected) ? selected : gallery[0];
  const asset = (url: string) => url.startsWith('/media/') ? (import.meta.env.VITE_API_URL ?? 'http://localhost:8000') + url : url;
  return <section className="catalog-section product-reference">
    <nav><Link to="/">Home</Link> / <Link to="/products">Collection</Link> / {p.name}</nav>
    <article className="detail-layout">
      <div><div className="gallery-stage">{image ? <img src={asset(image)} alt={p.name} /> : <span>{p.name}</span>}
        <div className="gallery-actions"><button aria-label="Save product" aria-pressed={saved.includes(p.id)} onClick={() => {
          const next = saved.includes(p.id) ? saved.filter(id => id !== p.id) : [...saved,p.id];
          setSaved(next); localStorage.setItem('saved-products', JSON.stringify(next));
        }}>{saved.includes(p.id) ? '♥' : '♡'}</button><button onClick={async () => { try { await navigator.clipboard.writeText(location.href); setShared('Link copied'); } catch { setShared('Copy the address from your browser'); } }}>Share</button></div></div>
        <div className="gallery-thumbs">{gallery.map((url,i) => <button key={url} aria-pressed={url === image} onClick={() => setSelected(url)}><img alt={'View ' + (i+1)} src={asset(url)} /></button>)}</div><small role="status">{shared}</small></div>
      <div><small>{p.brand ?? p.category} · {p.sku}</small><h1>{p.name}</h1><strong>₹{Number(p.price).toLocaleString('en-IN')}</strong>
      {p.rating && <p>★ {p.rating} ({p.review_count} reviews)</p>}<p>{p.description}</p><p>{p.stock_quantity} in stock</p>
      {variants.data && variants.data.length > 1 && <fieldset className="sku-options"><legend>Configuration, finish & protection</legend>
        {variants.data.map(option => <Link key={option.id} aria-current={option.id === p.id ? 'page' : undefined} to={'/products/' + option.id}>
          {[option.specifications.Configuration, option.specifications.Finish, option.specifications.Protection !== 'None' && option.specifications.Protection].filter(Boolean).join(' · ')} · ₹{Number(option.price).toLocaleString('en-IN')}
        </Link>)}</fieldset>}
      {isAuthenticated ? <form onSubmit={e => { e.preventDefault(); add.mutate(); }}>
        <label>Quantity <input type="number" required min={1} max={p.stock_quantity} value={quantity} onChange={e => setQuantity(Number(e.target.value))} /></label>
        <button disabled={!p.stock_quantity || add.isPending}>Add to cart</button>
      </form> : <Link to="/login">Sign in to add to cart</Link>}
      <p role="status">{add.error?.message ?? (add.isSuccess ? 'Added to cart' : '')}</p>
      <button onClick={openAssistant}>Compare with ShopPilot</button>
      <h3>How you’ll get this item</h3><div className="delivery-choices"><p>Delivery<br/><small>Select a carrier at checkout</small></p><p>Pickup<br/><small>Unavailable</small></p></div></div>
    </article>
    <h2>Specifications</h2><dl className="spec-tiles">{Object.entries({ ...p.specifications, Category: p.category, SKU: p.sku }).map(([key,value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>
    <ProductReviewsSection key={p.id} productId={p.id} />
    {related.data?.items.some(item => item.id !== p.id) && <section><h2>More to explore</h2>
      {related.data.items.filter(item => item.id !== p.id).map(item => <p key={item.id}><Link to={'/products/' + item.id}>{item.name}</Link></p>)}</section>}
  </section>;
}

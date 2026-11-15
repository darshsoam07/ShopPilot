import { useSearchParams } from 'react-router-dom';
import { useDebounce } from '../../hooks/useDebounce';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from './api';
import { ProductCard } from './ProductCard';

export function HomePage() {
  const [params, setParams] = useSearchParams();
  const query = useDebounce(params.toString(), 250);
  const update = (name: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value); else next.delete(name);
    if (name !== 'offset') next.delete('offset');
    setParams(next, { replace: true });
  };
  const productsQuery = useQuery({ queryKey: ['products', query], queryFn: () => getProducts(query) });

  return (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> A more thoughtful way to shop</div>
          <h1>Find what fits.<br /><span>Not just what's popular.</span></h1>
          <p>Explore a curated catalogue today. Soon, an AI shopping companion will help you find the right product for your needs and budget.</p>
          <a className="primary-button" href="/products">Explore the catalogue <span aria-hidden="true">↗</span></a>
          <div className="hero-proof"><span>✓</span> Product information comes from the live catalogue API</div>
        </div>
        <div className="hero-art" aria-label="Abstract shopping illustration">
          <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
          <div className="art-card art-card-main"><span className="art-card-icon">✦</span><small>YOUR NEXT GREAT FIND</small><strong>Good choices<br />start with<br /><em>better questions.</em></strong><div className="art-card-line" /></div>
          <div className="floating-chip chip-top">✧ AI-assisted discovery</div>
          <div className="floating-chip chip-bottom">◎ Built around your needs</div>
        </div>
      </section>

      <section className="catalog-section" id="featured">
        <div className="section-heading">
          <div><p className="eyebrow">THE COLLECTION</p><h2>Explore products</h2><p className="section-subtitle">A first look at the ShopPilot catalogue.</p></div>
          <span className="catalog-count">{productsQuery.data ? `${productsQuery.data.total} products` : 'Live catalogue'}</span>
        </div>
        <div className="catalog-filters">
          <label>Search <input type="search" maxLength={100} value={params.get('q') ?? ''} onChange={e => update('q', e.target.value)} /></label>
          <label>Category (SKU prefix) <input placeholder="e.g. LAP" value={params.get('category') ?? ''} onChange={e => update('category', e.target.value)} /></label>
          {['min_price','max_price'].map((key, i) => <label key={key}>{i ? 'Maximum' : 'Minimum'} price (₹) <input type="number" min="0" value={params.get(key) ?? ''} onChange={e => update(key, e.target.value)} /></label>)}
          <label>Sort <select value={params.get('sort') ?? 'newest'} onChange={e => update('sort', e.target.value)}>
            <option value="newest">Newest</option><option value="price_asc">Lowest price</option><option value="price_desc">Highest price</option><option value="name_asc">Name</option></select></label>
          <label><input type="checkbox" checked={params.get('in_stock') === 'true'} onChange={e => update('in_stock', e.target.checked ? 'true' : '')} /> In stock</label>
        </div>
        {productsQuery.isPending && <div className="state-panel">Loading products from the API…</div>}
        {productsQuery.isError && <div className="state-panel error-state"><strong>Couldn't load the catalogue.</strong><span>Make sure PostgreSQL, the FastAPI server, and the sample product seed script are running.</span><code>GET /api/v1/products</code></div>}
        {productsQuery.data && productsQuery.data.items.length === 0 && <div className="state-panel">No products match these filters.</div>}
        {productsQuery.data && productsQuery.data.items.length > 0 && <div className="product-grid">{productsQuery.data.items.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
        {productsQuery.data && <nav aria-label="Catalogue pages">
          {productsQuery.data.offset > 0 && <button onClick={() => update('offset', String(Math.max(0, productsQuery.data.offset - productsQuery.data.limit)))}>Previous</button>}
          {productsQuery.data.offset + productsQuery.data.limit < productsQuery.data.total && <button onClick={() => update('offset', String(productsQuery.data.offset + productsQuery.data.limit))}>Next</button>}
        </nav>}
      </section>
    </>
  );
}

import { Link, useSearchParams } from 'react-router-dom';
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
      <section className="campaign" aria-labelledby="campaign-title">
        <div className="campaign-copy">
          <p className="campaign-kicker">Technology, chosen with intention</p>
          <h1 id="campaign-title">Better tools.<br /><em>Better everyday.</em></h1>
          <p className="campaign-intro">Thoughtfully selected technology for work, creativity and everyday living.</p>
          <Link className="primary-button" to="/products">Explore the collection <span aria-hidden="true">→</span></Link>
        </div>
        <figure className="campaign-photo">
          <img src="/demo/nova.jpg" alt="Over-ear headphones photographed against a golden studio backdrop" fetchPriority="high" />
          <figcaption><span>Studio audio</span><Link to="/products?categories=Audio">Explore audio ↗</Link></figcaption>
        </figure>
      </section>
      <section className="catalog-section featured" id="featured">
        <div className="section-heading">
          <div><p className="eyebrow">THE COLLECTION</p><h2>The technology edit</h2></div>
          <span className="catalog-count">{productsQuery.data ? `${productsQuery.data.total} products` : 'Live catalogue'}</span>
        </div>
        <details className="edit-filters"><summary>Search &amp; filter</summary><div className="catalog-filters">
          <label>Search <input type="search" maxLength={100} value={params.get('q') ?? ''} onChange={e => update('q', e.target.value)} /></label>
          <label>Category (SKU prefix) <input placeholder="e.g. LAP" value={params.get('category') ?? ''} onChange={e => update('category', e.target.value)} /></label>
          {['min_price','max_price'].map((key, i) => <label key={key}>{i ? 'Maximum' : 'Minimum'} price (₹) <input type="number" min="0" value={params.get(key) ?? ''} onChange={e => update(key, e.target.value)} /></label>)}
          <label>Sort <select value={params.get('sort') ?? 'newest'} onChange={e => update('sort', e.target.value)}>
            <option value="newest">Newest</option><option value="price_asc">Lowest price</option><option value="price_desc">Highest price</option><option value="name_asc">Name</option></select></label>
          <label><input type="checkbox" checked={params.get('in_stock') === 'true'} onChange={e => update('in_stock', e.target.checked ? 'true' : '')} /> In stock</label>
        </div>
        </details>
        {productsQuery.isPending && <div className="state-panel" role="status">Loading the collection…</div>}
        {productsQuery.isError && <div className="state-panel error-state" role="alert"><strong>Couldn't load the catalogue.</strong><span>Please try again.</span><button onClick={() => productsQuery.refetch()}>Reload collection</button></div>}
        {productsQuery.data && productsQuery.data.items.length === 0 && <div className="state-panel">No products match these filters. <button onClick={() => setParams({})}>Clear filters</button></div>}
        {productsQuery.data && productsQuery.data.items.length > 0 && <div className="product-grid">{productsQuery.data.items.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
        {productsQuery.data && <nav aria-label="Catalogue pages">
          {productsQuery.data.offset > 0 && <button onClick={() => update('offset', String(Math.max(0, productsQuery.data.offset - productsQuery.data.limit)))}>Previous</button>}
          {productsQuery.data.offset + productsQuery.data.limit < productsQuery.data.total && <button onClick={() => update('offset', String(productsQuery.data.offset + productsQuery.data.limit))}>Next</button>}
        </nav>}
      </section>
    </>
  );
}

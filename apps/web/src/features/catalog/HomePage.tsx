import { Link, useSearchParams } from 'react-router-dom';
import { useDebounce } from '../../hooks/useDebounce';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from './api';
import { HeroBento } from '../../components/home/HeroBento';
import { ProductCard } from './ProductCard';

export function HomePage({ onOpenPalette }: { onOpenPalette: () => void }) {
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
      <HeroBento onOpenPalette={onOpenPalette} />
      <section className="catalog-section featured" id="featured">
        <div className="section-heading">
          <div><h2>The storefront selection</h2>
            <span className="catalog-count">{productsQuery.data ? `${productsQuery.data.total} products` : 'Live catalogue'}</span>
          </div>
          <Link className="text-action" to="/products?sort=newest">New arrivals <span aria-hidden="true">↗</span></Link>
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

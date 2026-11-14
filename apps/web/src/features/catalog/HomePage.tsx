import { useQuery } from '@tanstack/react-query';
import { getProducts } from './api';
import { ProductCard } from './ProductCard';

export function HomePage() {
  const productsQuery = useQuery({ queryKey: ['products'], queryFn: getProducts });

  return (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> A more thoughtful way to shop</div>
          <h1>Find what fits.<br /><span>Not just what's popular.</span></h1>
          <p>Explore a curated catalogue today. Soon, an AI shopping companion will help you find the right product for your needs and budget.</p>
          <a className="primary-button" href="#featured">Explore the catalogue <span aria-hidden="true">↗</span></a>
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
        {productsQuery.isPending && <div className="state-panel">Loading products from the API…</div>}
        {productsQuery.isError && <div className="state-panel error-state"><strong>Couldn't load the catalogue.</strong><span>Make sure PostgreSQL, the FastAPI server, and the sample product seed script are running.</span><code>GET /api/v1/products</code></div>}
        {productsQuery.data && productsQuery.data.items.length === 0 && <div className="state-panel">No products yet. Run the backend seed script to add sample products.</div>}
        {productsQuery.data && productsQuery.data.items.length > 0 && <div className="product-grid">{productsQuery.data.items.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
      </section>
    </>
  );
}

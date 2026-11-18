import { resolveProductMedia } from './productMedia';
import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from './api';
import { ProductImage } from './ProductImage';
import { Link } from 'react-router-dom';

const collections = [
  { category: 'Audio', label: 'Studio audio' },
  { category: 'Workstation', label: 'Workstations' },
  { category: 'Wearables', label: 'Wearables' },
];

export function StorefrontCampaign({ featuredSku = 'AUD-NOVA-001' }: { featuredSku?: string }) {
  const query = useQuery({ queryKey: ['campaign', featuredSku], queryFn: () => getProducts('q=' + encodeURIComponent(featuredSku)) });
  const product = query.data?.items.find(item => item.sku === featuredSku);
  const index = useRef<HTMLElement>(null);
  useEffect(() => {
    const node = index.current;
    if (!node || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        node.classList.add('in-view');
        observer.disconnect();
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <section className="campaign" aria-labelledby="campaign-title">
        <header className="model-heading"><h1 id="campaign-title">{product?.name ?? 'Studio audio'}</h1>
          <Link to="/products?categories=Audio">Explore audio ↗</Link>
        </header>
        <div className="campaign-art">
          {product ? <ProductImage url={resolveProductMedia(product).primary} name={product.name} priority /> : <span>Studio audio</span>}
        </div>
        {product && <div className="purchase-strip">
          <div><small>{product.sku} · {product.specifications.Configuration}</small><p>{product.description}</p></div>
          <strong>₹{Number(product.price).toLocaleString('en-IN')}</strong>
          <Link className="primary-button" to={`/products/${product.id}`}>View configuration →</Link>
        </div>}
      </section>
      <nav ref={index} className="collection-index" aria-label="Shop by category">
        <span>Shop by category</span>
        {collections.map(({ category, label }) => (
          <Link key={category} to={'/products?categories=' + encodeURIComponent(category)}>
            {label}<span aria-hidden="true">↗</span>
          </Link>
        ))}
      </nav>
    </>
  );
}

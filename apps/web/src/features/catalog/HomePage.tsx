import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';
import { HeroBento } from '../../components/home/HeroBento';
import { Reveal } from '../../components/motion/Reveal';
import { getProducts } from './api';
import { ProductGrid, ProductGridSkeleton } from './ProductGrid';
import { StorefrontCampaign } from './StorefrontCampaign';

export function HomePage({ onOpenPalette }: { onOpenPalette: () => void }) {
  const products = useQuery({ queryKey: ['products', 'home'], queryFn: () => getProducts('limit=8&offset=0&sort=newest') });

  return (
    <>
      <HeroBento onOpenPalette={onOpenPalette} />
      <StorefrontCampaign headingLevel={2} />

      <section className="home-selection container-editorial" aria-labelledby="selection-title" id="featured">
        <Reveal as="header" className="home-selection__head">
          <div>
            <h2 id="selection-title">New arrivals</h2>
            <p className="home-selection__count tnum" aria-live="polite">
              {products.data ? `${products.data.total} ${products.data.total === 1 ? 'product' : 'products'} in the catalogue` : 'Loading the catalogue'}
            </p>
          </div>
          <Link className="text-link" to="/products?sort=newest">View the collection <ArrowUpRight size={15} aria-hidden="true" /></Link>
        </Reveal>

        {products.isPending && <ProductGridSkeleton count={8} wide />}
        {products.isError && (
          <div className="state-panel error-state" role="alert">
            <strong>Couldn’t load the catalogue.</strong>
            <span>Check your connection and try again.</span>
            <button type="button" onClick={() => products.refetch()}>Try again</button>
          </div>
        )}
        {products.data && products.data.items.length === 0 && (
          <div className="state-panel">No products yet. <Link to="/products">Browse the collection</Link></div>
        )}
        {products.data && products.data.items.length > 0 && <ProductGrid products={products.data.items} wide />}
      </section>
    </>
  );
}

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { LayoutGrid, List, SlidersHorizontal, X } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { getJson } from '../../services/http';
import { LAYOUT_ID, SPRING, TRANSITION } from '../../lib/motion';
import { ProductGrid, ProductGridSkeleton } from './ProductGrid';
import type { Product } from './types';

interface CatalogResponse {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
  categories: Record<string, number>;
}

const CATEGORY_LABELS: Record<string, string> = {
  Audio: 'Studio audio',
  Workstation: 'Workstations',
  Wearables: 'Wearables',
  Accessories: 'Accessories',
  Lighting: 'Lighting',
};
const PRODUCT_TYPES = Object.keys(CATEGORY_LABELS);

type View = 'grid' | 'list';

export const CatalogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const qParam = searchParams.get('q') || '';
  const availabilityParam = searchParams.get('availability') || ''; // in_stock | out_of_stock
  const selectedTypes = (searchParams.get('categories') || '').split(',').filter(Boolean);
  const minPriceParam = searchParams.get('min_price') || '';
  const maxPriceParam = searchParams.get('max_price') || '';
  const sortParam = searchParams.get('sort') || 'relevance';
  const pageParam = Number(searchParams.get('page') || '1');

  const [view, setView] = useState<View>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const query = useDebounce(searchParams.toString(), 200);
  const result = useQuery({
    queryKey: ['catalog', query],
    queryFn: () => getJson<CatalogResponse>('/api/v1/products/catalog?' + query),
    placeholderData: keepPreviousData, // keeps the last grid on screen while filters change
  });
  const products = result.data?.items ?? [];
  const totalResults = result.data?.total ?? 0;
  const pageSize = result.data?.page_size ?? 9;
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const refreshing = result.isFetching && !result.isPending;

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key); else next.set(key, value);
    if (key !== 'page') next.set('page', '1');
    // Typing a search should not fill the back button with one entry per keystroke.
    setSearchParams(next, { replace: key === 'q' });
  };
  const toggleCategory = (category: string) => {
    const updated = selectedTypes.includes(category) ? selectedTypes.filter(item => item !== category) : [...selectedTypes, category];
    updateParam('categories', updated.length ? updated.join(',') : null);
  };
  const clearAllFilters = () => setSearchParams(new URLSearchParams());

  const categoryTypes = Array.from(new Set([...PRODUCT_TYPES, ...Object.keys(result.data?.categories ?? {})]));
  const hasFilters = Boolean(qParam || availabilityParam || selectedTypes.length || minPriceParam || maxPriceParam);
  const activeChips: { key: string; label: string; clear: () => void }[] = [
    ...selectedTypes.map(category => ({ key: 'c-' + category, label: CATEGORY_LABELS[category] ?? category, clear: () => toggleCategory(category) })),
    ...(qParam ? [{ key: 'q', label: `“${qParam}”`, clear: () => updateParam('q', null) }] : []),
    ...(availabilityParam ? [{ key: 'availability', label: availabilityParam === 'in_stock' ? 'In stock' : 'Out of stock', clear: () => updateParam('availability', null) }] : []),
    ...(minPriceParam ? [{ key: 'min_price', label: 'From ₹' + minPriceParam, clear: () => updateParam('min_price', null) }] : []),
    ...(maxPriceParam ? [{ key: 'max_price', label: 'Up to ₹' + maxPriceParam, clear: () => updateParam('max_price', null) }] : []),
  ];

  return (
    <section className="collection-page container-editorial">
      <nav aria-label="Breadcrumb" className="collection-crumbs"><Link to="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">Collection</span></nav>
      <header className="collection-heading">
        <h1>Collection</h1>
        <label className="collection-search">Search products
          <input type="search" value={qParam} maxLength={100} onChange={event => updateParam('q', event.target.value)} />
        </label>
      </header>

      <nav className="category-strip" aria-label="Browse categories">
        {categoryTypes.map(category => (
          <button key={category} type="button" className="chip" aria-pressed={selectedTypes.includes(category)} onClick={() => toggleCategory(category)}>
            {CATEGORY_LABELS[category] ?? category}
            <span className="chip__count tnum">{result.data?.categories[category] ?? 0}</span>
          </button>
        ))}
      </nav>

      <div className="collection-tools">
        <strong aria-live="polite" className="tnum">{products.length} of {totalResults} results</strong>
        <button type="button" className="filters-toggle" aria-controls="collection-filters" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)}>
          <SlidersHorizontal size={15} aria-hidden="true" /> Filters
        </button>
        <label>Sort by
          <select value={sortParam} onChange={event => updateParam('sort', event.target.value)}>
            <option value="relevance">Relevance</option>
            <option value="price_asc">Lowest price</option>
            <option value="price_desc">Highest price</option>
            <option value="newest">Newest arrivals</option>
          </select>
        </label>
        <LayoutGroup id="catalog-view">
          <div className="segmented" role="group" aria-label="Layout">
            {(['grid', 'list'] as const).map(mode => (
              <button key={mode} type="button" aria-pressed={view === mode} onClick={() => setView(mode)}>
                {view === mode && <motion.span layoutId={LAYOUT_ID.catalogChip} className="segmented__pill" transition={SPRING.indicator} aria-hidden="true" />}
                <span className="segmented__label">
                  {mode === 'grid' ? <LayoutGrid size={14} aria-hidden="true" /> : <List size={14} aria-hidden="true" />}
                  {mode === 'grid' ? 'Grid' : 'List'}
                </span>
              </button>
            ))}
          </div>
        </LayoutGroup>
      </div>

      <div className="collection-layout">
        <aside id="collection-filters" data-open={filtersOpen} aria-label="Catalogue filters">
          <details open>
            <summary>Availability</summary>
            {(['in_stock', 'out_of_stock'] as const).map(value => (
              <label key={value}><input type="checkbox" checked={availabilityParam === value} onChange={() => updateParam('availability', availabilityParam === value ? null : value)} />{value === 'in_stock' ? 'In stock' : 'Out of stock'}</label>
            ))}
          </details>
          <details open>
            <summary>Product type</summary>
            {categoryTypes.map(type => (
              <label key={type}><input type="checkbox" checked={selectedTypes.includes(type)} onChange={() => toggleCategory(type)} />{CATEGORY_LABELS[type] ?? type} <span className="tnum">({result.data?.categories[type] ?? 0})</span></label>
            ))}
          </details>
          <details open>
            <summary>Price range (₹)</summary>
            {([['min_price', 'Minimum', minPriceParam], ['max_price', 'Maximum', maxPriceParam]] as const).map(([key, label, value]) => (
              <label key={key}>{label}<input type="number" min="0" value={value} onChange={event => updateParam(key, event.target.value)} /></label>
            ))}
          </details>
        </aside>

        <div className="collection-results">
          <div className="filter-chips" hidden={!hasFilters}>
            <AnimatePresence initial={false} mode="popLayout">
              {activeChips.map(chip => (
                <motion.button key={chip.key} layout="position" type="button" className="chip chip--active"
                  initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
                  transition={TRANSITION.hover} onClick={chip.clear} aria-label={`Remove filter: ${chip.label}`}>
                  {chip.label} <X size={12} aria-hidden="true" />
                </motion.button>
              ))}
            </AnimatePresence>
            {hasFilters && <button type="button" className="text-link" onClick={clearAllFilters}>Clear all</button>}
          </div>

          {result.isPending ? (
            <div role="status" aria-label="Loading products"><ProductGridSkeleton count={6} view={view} /></div>
          ) : result.isError ? (
            <div role="alert" className="state-panel error-state">
              <strong>Couldn’t load products.</strong>
              <span>Check your connection and try again.</span>
              <button type="button" onClick={() => result.refetch()}>Retry</button>
            </div>
          ) : products.length ? (
            <ProductGrid products={products} view={view} stale={refreshing} prioritizeFirst />
          ) : (
            <div className="state-panel">
              No products match these filters. <button type="button" onClick={clearAllFilters}>Clear filters</button>
            </div>
          )}

          {totalPages > 1 && (
            <nav className="pagination" aria-label="Collection pages">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
                <button key={page} type="button" className="tnum" aria-current={pageParam === page ? 'page' : undefined} onClick={() => updateParam('page', String(page))}>{page}</button>
              ))}
            </nav>
          )}
        </div>
      </div>
    </section>
  );
};

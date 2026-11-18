import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDebounce } from "../../hooks/useDebounce";
import { useQuery } from "@tanstack/react-query";
import { getJson } from "../../services/http";
import { Product } from "./types";
import { ProductCard } from "./ProductCard";
import { ProductImage } from "./ProductImage";

interface CatalogResponse {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
  categories: Record<string, number>;
}

const VISUAL_CATEGORIES = [
  {
    id: "Audio",
    label: "Studio Audio",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "Workstation",
    label: "Workstations",
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "Wearables",
    label: "Smart Wearables",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "Accessories",
    label: "Desk Minimal",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "Lighting",
    label: "Ambient Lamps",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80",
  },
];

const PRODUCT_TYPES = ["Audio", "Workstation", "Wearables", "Accessories", "Lighting"];

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL-synchronized filter state
  const qParam = searchParams.get("q") || "";
  const availabilityParam = searchParams.get("availability") || ""; // "in_stock" | "out_of_stock"
  const selectedTypes = (searchParams.get("categories") || "")
    .split(",")
    .filter(Boolean);
  const minPriceParam = searchParams.get("min_price") || "";
  const maxPriceParam = searchParams.get("max_price") || "";
  const sortParam = searchParams.get("sort") || "relevance";
  const pageParam = Number(searchParams.get("page") || "1");

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const query = useDebounce(searchParams.toString(), 200);
  const result = useQuery({ queryKey: ["catalog", query], queryFn: () => getJson<CatalogResponse>("/api/v1/products/catalog?" + query) });
  const products = result.data?.items ?? [];
  const totalResults = result.data?.total ?? 0;
  const pageSize = result.data?.page_size ?? 9;
  const loading = result.isPending;

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (!value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    if (key !== "page") next.set("page", "1");
    setSearchParams(next);
  };

  const toggleCategory = (cat: string) => {
    const exists = selectedTypes.includes(cat);
    const updated = exists
      ? selectedTypes.filter((c) => c !== cat)
      : [...selectedTypes, cat];
    updateParam("categories", updated.length ? updated.join(",") : null);
  };

  const clearAllFilters = () => {

    setSearchParams(new URLSearchParams());
  };

  const categoryTypes = Array.from(new Set([...PRODUCT_TYPES, ...Object.keys(result.data?.categories ?? {})]));
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));

  const [filtersOpen, setFiltersOpen] = useState(false);
  const hasFilters = Boolean(qParam || availabilityParam || selectedTypes.length || minPriceParam || maxPriceParam);

  return (
    <section className="collection-page">
      <Link to="/">Home</Link> / Collection
      <header className="collection-heading">
        <h1>Collection</h1>
        <label>Search products<input type="search" value={qParam} onChange={e => updateParam("q", e.target.value)} /></label>
      </header>
      <nav className="category-strip" aria-label="Browse categories">
        {VISUAL_CATEGORIES.map(cat => (
          <button key={cat.id} aria-pressed={selectedTypes.includes(cat.id)} onClick={() => toggleCategory(cat.id)}>
            <span className="category-photo"><ProductImage url={cat.image} name={cat.label} /></span>{cat.label}
          </button>
        ))}
      </nav>
      <div className="collection-tools">
        <strong aria-live="polite">{products.length} of {totalResults} results</strong>
        <button className="filters-toggle" aria-controls="collection-filters" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)}>Filters</button>
        <label>Sort by <select value={sortParam} onChange={e => updateParam("sort", e.target.value)}>
          <option value="relevance">Relevance</option><option value="price_asc">Lowest price</option>
          <option value="price_desc">Highest price</option><option value="newest">Newest arrivals</option>
        </select></label>
        {(["grid","list"] as const).map(mode => <button key={mode} aria-pressed={viewMode === mode} onClick={() => setViewMode(mode)}>{mode === "grid" ? "Grid" : "List"}</button>)}
      </div>
      <div className="collection-layout">
        <aside id="collection-filters" data-open={filtersOpen} aria-label="Catalogue filters">
          <details open><summary>Availability</summary>{["in_stock","out_of_stock"].map(value => <label key={value}><input type="checkbox" checked={availabilityParam === value} onChange={() => updateParam("availability", availabilityParam === value ? null : value)} />{value === "in_stock" ? "In stock" : "Out of stock"}</label>)}</details>
          <details open><summary>Product type</summary>{categoryTypes.map(type => <label key={type}><input type="checkbox" checked={selectedTypes.includes(type)} onChange={() => toggleCategory(type)} />{type} ({result.data?.categories[type] ?? 0})</label>)}</details>
          <details open><summary>Price range (₹)</summary>{[["min_price","Minimum",minPriceParam],["max_price","Maximum",maxPriceParam]].map(([key,label,value]) => <label key={key}>{label}<input type="number" min="0" value={value} onChange={e => updateParam(key,e.target.value)} /></label>)}</details>
        </aside>
        <div className="collection-results">
          {hasFilters && <div className="filter-chips">
            {selectedTypes.map(cat => <button key={cat} onClick={() => toggleCategory(cat)}>{cat} ×</button>)}
            {[["q",qParam],["availability",availabilityParam.replace(/_/g," ")],["min_price",minPriceParam && "From ₹"+minPriceParam],["max_price",maxPriceParam && "Up to ₹"+maxPriceParam]].map(([key,label]) => label && <button key={key} onClick={() => updateParam(key,null)}>{label} ×</button>)}
            <button onClick={clearAllFilters}>Clear all</button></div>}
          {loading ? <p role="status" className="state-panel">Loading products…</p> : result.isError ? <div role="alert" className="state-panel">Unable to load products. <button onClick={() => result.refetch()}>Retry</button></div> : products.length ? (
            <div className="product-grid" data-view={viewMode}>{products.map(product => <ProductCard product={product} key={product.id} />)}</div>
          ) : <div className="state-panel">No products match these filters. <button onClick={clearAllFilters}>Clear filters</button></div>}
          {totalPages > 1 && <nav aria-label="Collection pages">{Array.from({length:totalPages},(_,index) => index+1).map(page => <button key={page} aria-current={pageParam===page ? "page" : undefined} onClick={() => updateParam("page",String(page))}>{page}</button>)}</nav>}
        </div>
      </div>
    </section>
  );
};

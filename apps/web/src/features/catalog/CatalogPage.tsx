import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useDebounce } from "../../hooks/useDebounce";
import { useQuery } from "@tanstack/react-query";
import { getJson } from "../../services/http";
import { Product } from "./types";

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

  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));

  return (
    <main
      style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "28px 24px 64px",
        color: "var(--text-primary, #141413)",
      }}
    >
      {/* 1. Breadcrumb & Editorial Serif Title (16pixel style) */}
      <div style={{ marginBottom: "24px" }}>
        <div
          style={{
            fontSize: "13px",
            color: "var(--text-secondary, #6E6D68)",
            marginBottom: "8px",
          }}
        >
          <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>
            Home
          </Link>{" "}
          / <span style={{ color: "var(--text-primary, #141413)" }}>Collection</span>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "44px",
              fontWeight: 500,
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            All products
          </h1>

          {/* Search Pill */}
          <div style={{ position: "relative", minWidth: "260px" }}>
            <input
              type="search"
              value={qParam}
              onChange={(e) => updateParam("q", e.target.value)}
              placeholder="Search product..."
              style={{
                width: "100%",
                padding: "10px 16px",
                borderRadius: "999px",
                border: "1px solid var(--border-hairline, #E5E3DD)",
                backgroundColor: "var(--bg-elevated, #FFFFFF)",
                fontSize: "13px",
              }}
            />
          </div>
        </div>
      </div>

      {/* 2. Top Visual Category Strip (5 Cards) */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "18px",
          paddingBottom: "32px",
          borderBottom: "1px solid var(--border-hairline, #E5E3DD)",
          marginBottom: "24px",
        }}
      >
        {VISUAL_CATEGORIES.map((cat) => {
          const isSelected = selectedTypes.includes(cat.id);
          return (
            <button
              key={cat.id}
              onClick={() => toggleCategory(cat.id)}
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  height: "200px",
                  borderRadius: "14px",
                  overflow: "hidden",
                  marginBottom: "10px",
                  border: isSelected
                    ? "2px solid var(--accent-ai, #E85D34)"
                    : "1px solid var(--border-hairline, #E5E3DD)",
                  backgroundColor: "var(--bg-elevated, #FFFFFF)",
                }}
              >
                <img
                  src={cat.image}
                  alt={cat.label}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected
                    ? "var(--accent-ai, #E85D34)"
                    : "var(--text-primary, #141413)",
                }}
              >
                {cat.label}
              </span>
            </button>
          );
        })}
      </section>

      {/* 3. Results Count, Sort Dropdown & Grid/List Switcher */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div style={{ fontSize: "14px", fontWeight: 500 }}>
          {products.length} of {totalResults} results
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "13px", color: "var(--text-secondary, #6E6D68)" }}>
            Sort By
          </span>
          <select
            value={sortParam}
            onChange={(e) => updateParam("sort", e.target.value)}
            style={{
              padding: "8px 14px",
              borderRadius: "999px",
              border: "1px solid var(--border-hairline, #E5E3DD)",
              backgroundColor: "var(--bg-elevated, #FFFFFF)",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            <option value="relevance">Relevance</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="newest">Newest Arrivals</option>
          </select>

          {/* Grid / List Toggle Pill */}
          <div
            style={{
              display: "flex",
              border: "1px solid var(--border-hairline, #E5E3DD)",
              borderRadius: "999px",
              overflow: "hidden",
              backgroundColor: "var(--bg-elevated, #FFFFFF)",
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode("list")}
              style={{
                padding: "6px 12px",
                border: "none",
                background:
                  viewMode === "list" ? "var(--bg-ai-panel, #F2F0EC)" : "transparent",
                cursor: "pointer",
                fontSize: "13px",
              }}
              title="List View"
            >
              ☰
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              style={{
                padding: "6px 12px",
                border: "none",
                background:
                  viewMode === "grid" ? "var(--bg-ai-panel, #F2F0EC)" : "transparent",
                cursor: "pointer",
                fontSize: "13px",
              }}
              title="Grid View"
            >
              ⊞
            </button>
          </div>
        </div>
      </div>

      {/* 4. Main Two-Column Layout: Left Sidebar + Right Product Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "var(--catalog-columns, 240px minmax(0, 1fr))",
          gap: "32px",
          alignItems: "start",
        }}
      >
        {/* Left Filter Sidebar */}
        <aside
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            paddingRight: "16px",
          }}
        >
          {/* Availability Filter */}
          <details open
            style={{
              borderBottom: "1px solid var(--border-hairline, #E5E3DD)",
              paddingBottom: "20px",
            }}
          >
            <summary
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: 600,
                fontSize: "14px",
                marginBottom: "12px",
              }}
            >
              <span>Availability</span>
              <span>⌃</span>
            </summary>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "13px",
                marginBottom: "8px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={availabilityParam === "in_stock"}
                onChange={() =>
                  updateParam(
                    "availability",
                    availabilityParam === "in_stock" ? null : "in_stock"
                  )
                }
              />
              In Stock
            </label>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={availabilityParam === "out_of_stock"}
                onChange={() =>
                  updateParam(
                    "availability",
                    availabilityParam === "out_of_stock" ? null : "out_of_stock"
                  )
                }
              />
              Out Of Stock
            </label>
          </details>

          {/* Product Type Checkboxes */}
          <details open
            style={{
              borderBottom: "1px solid var(--border-hairline, #E5E3DD)",
              paddingBottom: "20px",
            }}
          >
            <summary
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontWeight: 600,
                fontSize: "14px",
                marginBottom: "12px",
              }}
            >
              <span>Product type</span>
              <span>⌃</span>
            </summary>

            {Array.from(new Set([...PRODUCT_TYPES, ...Object.keys(result.data?.categories ?? {})])).map((type) => (
              <label
                key={type}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "13px",
                  marginBottom: "9px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type)}
                  onChange={() => toggleCategory(type)}
                />
                {type} ({result.data?.categories[type] ?? 0})
              </label>
            ))}
          </details>

          {/* Price Range Filter */}
          <details open>
            <summary
              style={{
                fontWeight: 600,
                fontSize: "14px",
                marginBottom: "12px",
              }}
            >
              Price range (₹)
            </summary>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <input
                type="number"
                placeholder="Min"
                value={minPriceParam}
                onChange={(e) => updateParam("min_price", e.target.value || null)}
                style={{
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-hairline, #E5E3DD)",
                  fontSize: "12px",
                }}
              />
              <input
                type="number"
                placeholder="Max"
                value={maxPriceParam}
                onChange={(e) => updateParam("max_price", e.target.value || null)}
                style={{
                  padding: "8px",
                  borderRadius: "6px",
                  border: "1px solid var(--border-hairline, #E5E3DD)",
                  fontSize: "12px",
                }}
              />
            </div>
          </details>
        </aside>

        {/* Right Column: Active Filter Pills + Product Cards */}
        <section>
          {/* Active Removable Filter Chips (16pixel style) */}
          {(availabilityParam ||
            selectedTypes.length > 0 ||
            minPriceParam ||
            maxPriceParam ||
            qParam) && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "8px",
                marginBottom: "20px",
              }}
            >
              {availabilityParam && (
                <button
                  onClick={() => updateParam("availability", null)}
                  style={chipButtonStyle}
                >
                  {availabilityParam === "in_stock" ? "In Stock" : "Out of Stock"} ×
                </button>
              )}

              {selectedTypes.map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  style={chipButtonStyle}
                >
                  {cat} ×
                </button>
              ))}

              {(minPriceParam || maxPriceParam) && (
                <button
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.delete("min_price");
                    next.delete("max_price");
                    setSearchParams(next);
                  }}
                  style={chipButtonStyle}
                >
                  ₹{minPriceParam || "0"} - ₹{maxPriceParam || "∞"} ×
                </button>
              )}

              <button
                onClick={clearAllFilters}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "var(--text-primary, #141413)",
                  marginLeft: "6px",
                }}
              >
                Clear All
              </button>
            </div>
          )}

          {/* Product Grid */}
          {result.error && <p role="alert">{result.error.message}</p>}
          {loading ? (
            <div style={{ padding: "48px 0", color: "var(--text-secondary, #6E6D68)" }}>
              Loading curated products...
            </div>
          ) : products.length === 0 ? (
            <div
              style={{
                padding: "48px",
                textAlign: "center",
                borderRadius: "14px",
                backgroundColor: "var(--bg-elevated, #FFFFFF)",
                border: "1px solid var(--border-hairline, #E5E3DD)",
              }}
            >
              <p>No products match your active filters.</p>
              <button onClick={clearAllFilters} style={chipButtonStyle}>
                Reset Filters
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  viewMode === "grid"
                    ? "repeat(auto-fill, minmax(260px, 1fr))"
                    : "1fr",
                gap: "20px",
              }}
            >
              {products.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    backgroundColor: "var(--bg-elevated, #FFFFFF)",
                    borderRadius: "14px",
                    border: "1px solid var(--border-hairline, #E5E3DD)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: viewMode === "list" ? "row" : "column",
                    transition: "transform 0.15s ease",
                  }}
                >
                  {/* Card Image Box with Top-Left Category Pill */}
                  <div
                    style={{
                      position: "relative",
                      backgroundColor: "var(--bg-ai-panel, #F2F0EC)",
                      height: viewMode === "list" ? "180px" : "290px",
                      width: viewMode === "list" ? "240px" : "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "24px",
                    }}
                  >
                    <span
                      style={{
                        position: "absolute",
                        top: "14px",
                        left: "14px",
                        padding: "5px 12px",
                        borderRadius: "999px",
                        backgroundColor: "var(--bg-elevated, #FFFFFF)",
                        fontSize: "11px",
                        fontWeight: 500,
                        color: "var(--text-primary, #141413)",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                      }}
                    >
                      {product.category || "Collection"}
                    </span>

                    {product.image_url ? (
                      <img
                        src={product.image_url.startsWith('/media/') ? (import.meta.env.VITE_API_URL ?? 'http://localhost:8000') + product.image_url : product.image_url}
                        alt={product.name}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "100%",
                          objectFit: "contain",
                          mixBlendMode: "multiply",
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                        {product.name}
                      </span>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div
                    style={{
                      padding: "16px 18px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      flex: 1,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "15px", marginBottom: "4px" }}>
                        {product.name}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "var(--text-secondary, #6E6D68)",
                          marginBottom: "10px",
                        }}
                      >
                        {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of stock"}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "16px" }}>
                      ₹{Number(product.price).toFixed(2)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "8px",
                marginTop: "36px",
              }}
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => updateParam("page", String(p))}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-hairline, #E5E3DD)",
                    backgroundColor:
                      p === pageParam
                        ? "var(--cta-bg, #141413)"
                        : "var(--bg-elevated, #FFFFFF)",
                    color:
                      p === pageParam
                        ? "var(--cta-text, #F9F8F6)"
                        : "var(--text-primary, #141413)",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

const chipButtonStyle: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: "999px",
  border: "1px solid var(--border-hairline, #E5E3DD)",
  backgroundColor: "var(--bg-ai-panel, #F2F0EC)",
  color: "var(--text-primary, #141413)",
  fontSize: "12px",
  cursor: "pointer",
};

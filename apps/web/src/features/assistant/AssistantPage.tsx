import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { postJson } from '../../services/http';
import { ProductCard } from '../catalog/ProductCard';
import type { Product } from '../catalog/types';

interface RecommendationResponse {
  agent: string;
  explanation: string;
  items: Product[];
  total: number;
}

const EXAMPLES = [
  'Laptop for Python programming under ₹60,000',
  'Wireless headphones with noise cancellation',
  'Smartwatch for everyday fitness tracking',
];

export function AssistantPage() {
  const [query, setQuery] = useState('');
  const recommendationMutation = useMutation({
    mutationFn: (searchQuery: string) => postJson<RecommendationResponse>('/api/v1/assistant/recommendations', { query: searchQuery, limit: 6 }),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim().length >= 2) recommendationMutation.mutate(query.trim());
  }

  return (
    <>
      <section className="assistant-page">
        <div className="assistant-panel assistant-panel-wide">
          <div className="assistant-symbol">✦</div>
          <p className="eyebrow">SHOPPILOT INTELLIGENCE · CATALOGUE AGENT</p>
          <h1>Find the right product.<br /><span>Start with what you need.</span></h1>
          <p className="assistant-intro">Describe your use case, preferences or budget. ShopPilot searches the live catalogue and explains matching in-stock products. This initial version uses a transparent rule-based recommendation service, not a generative LLM.</p>
          <form className="assistant-search" onSubmit={handleSubmit}>
            <label htmlFor="assistant-query">What are you looking for?</label>
            <textarea id="assistant-query" value={query} onChange={(event) => setQuery(event.target.value)} minLength={2} maxLength={500} placeholder="Example: A laptop for Python programming under ₹60,000" required />
            <button className="primary-button assistant-submit" type="submit" disabled={recommendationMutation.isPending || query.trim().length < 2}>
              {recommendationMutation.isPending ? 'Searching catalogue…' : 'Find matching products ↗'}
            </button>
          </form>
          <div className="assistant-examples"><span>Try:</span>{EXAMPLES.map((example) => <button type="button" key={example} onClick={() => { setQuery(example); recommendationMutation.mutate(example); }}>{example}</button>)}</div>
          {recommendationMutation.isError && <div className="form-error" role="alert">{recommendationMutation.error.message}</div>}
          {recommendationMutation.data && <div className="assistant-result-note"><strong>{recommendationMutation.data.total} matching product(s)</strong><span>{recommendationMutation.data.explanation}</span><small>Service: {recommendationMutation.data.agent}</small></div>}
        </div>
      </section>
      {recommendationMutation.data && <section className="catalog-section assistant-results">
        <div className="section-heading"><div><p className="eyebrow">CATALOGUE MATCHES</p><h2>Recommended for your request</h2></div></div>
        {recommendationMutation.data.items.length ? <div className="product-grid">{recommendationMutation.data.items.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="state-panel">No matching products were found. Try broader criteria or a different budget.</div>}
      </section>}
    </>
  );
}

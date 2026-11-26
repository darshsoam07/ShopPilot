import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowUpRight } from 'lucide-react';
import { postJson } from '../../services/http';
import { ProductGrid, ProductGridSkeleton } from '../catalog/ProductGrid';
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
  const recommend = useMutation({
    mutationFn: (searchQuery: string) => postJson<RecommendationResponse>('/api/v1/assistant/recommendations', { query: searchQuery, limit: 6 }),
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim().length >= 2) recommend.mutate(query.trim());
  }

  return (
    <div className="assistant-page">
      <section className="container-editorial assistant-intro" aria-labelledby="assistant-title">
        <h1 id="assistant-title">Find the right product.<br />Start with what you need.</h1>
        <p>
          Describe the use, the features you care about or your budget. ShopPilot searches the live
          catalogue and explains why each in-stock match fits. Matching is rule-based, not a language model.
        </p>
        <form className="assistant-form" onSubmit={handleSubmit}>
          <label htmlFor="assistant-query">What are you looking for?</label>
          <textarea id="assistant-query" value={query} onChange={event => setQuery(event.target.value)} minLength={2} maxLength={500}
            placeholder="For example: a laptop for Python programming under ₹60,000" required />
          <button className="btn-primary" type="submit" disabled={recommend.isPending || query.trim().length < 2}>
            {recommend.isPending ? 'Searching the catalogue…' : <>Find matching products <ArrowUpRight size={16} aria-hidden="true" /></>}
          </button>
        </form>
        <div className="assistant-examples">
          <span>Try</span>
          {EXAMPLES.map(example => (
            <button type="button" className="chip" key={example} onClick={() => { setQuery(example); recommend.mutate(example); }}>{example}</button>
          ))}
        </div>
      </section>

      <section className="container-editorial assistant-results" aria-live="polite" aria-label="Recommendations">
        {recommend.isError && <div className="form-error" role="alert">{recommend.error.message}</div>}
        {recommend.isPending && <div role="status" aria-label="Searching the catalogue"><ProductGridSkeleton count={3} wide /></div>}
        {recommend.data && (
          <>
            <header className="assistant-results__head">
              <h2>{recommend.data.total} {recommend.data.total === 1 ? 'match' : 'matches'}</h2>
              <p>{recommend.data.explanation}</p>
              <small>Service: {recommend.data.agent}</small>
            </header>
            {recommend.data.items.length
              ? <ProductGrid products={recommend.data.items} wide />
              : <div className="state-panel">No matching products were found. Try broader criteria or a different budget.</div>}
          </>
        )}
      </section>
    </div>
  );
}

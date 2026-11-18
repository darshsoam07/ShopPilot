import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { StorefrontCampaign } from '../src/features/catalog/StorefrontCampaign';

export function mountAlabasterCampaign() {
  const host = document.createElement('main');
  document.body.replaceChildren(host);
  createRoot(host).render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter><StorefrontCampaign featuredSku="AUD-NOVA-ALB" /></MemoryRouter>
    </QueryClientProvider>
  );
}

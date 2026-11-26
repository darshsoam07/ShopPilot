import "@fontsource/instrument-serif/400.css";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/geist-mono";
// index.css must stay first: it fixes the cascade layer order for every file below.
import "./styles/index.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/legacy.css";
import "./styles/shell.css";
import "./styles/product-card.css";
import "./styles/overlays.css";
import "./styles/home.css";
import "./styles/collection.css";
import "./styles/pdp.css";
import "./styles/checkout.css";
import { MotionConfig } from 'motion/react';
import { CartDrawerProvider } from './features/cart/CartDrawerContext';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App';
import { AuthProvider } from './context/AuthContext';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 } },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider><MotionConfig reducedMotion="user"><CartDrawerProvider><App /></CartDrawerProvider></MotionConfig></AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);

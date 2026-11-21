import "@fontsource-variable/fraunces";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/geist-mono";
import './styles.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/phase3.css';
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

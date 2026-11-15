import { CatalogPage } from '../features/catalog/CatalogPage';
import { ProductDetailPage } from '../features/catalog/ProductDetailPage';
import { AssistantDrawer } from '../components/layout/AssistantDrawer';
import { Route, Routes } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { HomePage } from '../features/catalog/HomePage';
import { AssistantPage } from '../features/assistant/AssistantPage';
import { AuthPage } from '../features/auth/AuthPage';
import { CartPage } from '../features/cart/CartPage';
import { OrdersPage } from '../features/orders/OrdersPage';
import { AdminPage } from '../features/admin/AdminPage';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/layout/Navbar';
import { CheckoutPage } from '../features/orders/CheckoutPage';

export default function App() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const client = useQueryClient();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(value => !value);
      } else if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <div className="app-shell">
      <Navbar open={() => setOpen(true)} />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<CatalogPage />} />
          <Route path="/products/:productId" element={<ProductDetailPage openAssistant={() => setOpen(true)} />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/orders" element={<OrdersPage />} />
          </Route>
          <Route element={<ProtectedRoute requiredRole="admin" />} >
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </main>
      <button className="copilot-trigger" onClick={() => setOpen(true)}>✦ Ask ShopPilot</button>
      <AssistantDrawer key={user?.id ?? 'guest'} isOpen={open} onClose={() => setOpen(false)} onCartUpdated={() => client.invalidateQueries({ queryKey: ['cart'] })} />
      <footer className="site-footer"><span>© {new Date().getFullYear()} ShopPilot</span><span>Smarter shopping, thoughtfully built.</span></footer>
    </div>
  );
}

import { CartDrawer } from '../components/layout/CartDrawer';
import { useCartDrawer } from '../features/cart/CartDrawerContext';
import { SmoothScroll } from '../components/motion/SmoothScroll';
import { CatalogPage } from '../features/catalog/CatalogPage';
import { ProductDetailPage } from '../features/catalog/ProductDetailPage';
import { CommandPalette } from '../components/layout/CommandPalette';
import { Link, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { HomePage } from '../features/catalog/HomePage';
import { AssistantPage } from '../features/assistant/AssistantPage';
import { AuthPage } from '../features/auth/AuthPage';
import { CartPage } from '../features/cart/CartPage';
import { OrdersPage } from '../features/orders/OrdersPage';
import { AdminOrdersPage } from '../features/admin/AdminOrdersPage';
import { AddressesPage } from '../features/orders/AddressesPage';
import { AdminPage } from '../features/admin/AdminPage';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/layout/Navbar';
import { CheckoutPage } from '../features/orders/CheckoutPage';

export default function App() {
  const { isOpen, closeDrawer } = useCartDrawer();
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        closeDrawer();
        setOpen(value => !value);
      } else if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeDrawer]);
  return (
    <SmoothScroll paused={open || (isOpen && !!user)}>
    <div className="app-shell" inert={open || (isOpen && !!user)}>
      <a className="skip-content" href="#store-content">Skip to content</a>
      <Navbar open={() => setOpen(true)} />
      <main id="store-content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<HomePage onOpenPalette={() => setOpen(true)} />} />
          <Route path="/products" element={<CatalogPage />} />
          <Route path="/products/:productId" element={<ProductDetailPage openAssistant={() => setOpen(true)} />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/account/addresses" element={<AddressesPage />} />
            <Route path="/orders" element={<OrdersPage />} />
          </Route>
          <Route element={<ProtectedRoute requiredRole="admin" />} >
            <Route path="/admin/orders" element={<AdminOrdersPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </main>
      <footer className="site-footer">
        <Link className="footer-brand" to="/">ShopPilot</Link>
        <span>© {new Date().getFullYear()} ShopPilot</span>
        <nav aria-label="Footer">
          <Link to="/products">Collection</Link>
          <Link to="/products?sort=newest">New arrivals</Link>
          <Link to="/assistant">Shopping assistant</Link>
        </nav>
      </footer>
    </div>
    <CommandPalette key={user?.id ?? "guest"} isOpen={open} onClose={() => setOpen(false)} />
    {user && <CartDrawer key={user.id} />}
    </SmoothScroll>
  );
}

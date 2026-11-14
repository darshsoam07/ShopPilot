import { Link, NavLink, Route, Routes } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { HomePage } from '../features/catalog/HomePage';
import { AssistantPage } from '../features/assistant/AssistantPage';
import { AuthPage } from '../features/auth/AuthPage';
import { CartPage } from '../features/cart/CartPage';
import { OrdersPage } from '../features/orders/OrdersPage';
import { AdminPage } from '../features/admin/AdminPage';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { getCart } from '../features/cart/api';

function SiteHeader() {
  const { user, logout, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const clearPrivateQueries = () => {
    queryClient.removeQueries({ queryKey: ['cart'] });
    queryClient.removeQueries({ queryKey: ['orders'] });
  };
  const handleLogout = () => { logout(); clearPrivateQueries(); };
  useEffect(() => {
    window.addEventListener('shoppilot:unauthorized', clearPrivateQueries);
    return () => window.removeEventListener('shoppilot:unauthorized', clearPrivateQueries);
  }, [queryClient]);
  const cartQuery = useQuery({ queryKey: ['cart'], queryFn: getCart, enabled: isAuthenticated });
  return (
    <header className="site-header">
      <Link to="/" className="brand"><span className="brand-mark">S</span> ShopPilot</Link>
      <nav className="main-nav" aria-label="Main navigation">
        <NavLink to="/" end>Discover</NavLink>
        <NavLink to="/assistant">AI Assistant</NavLink>
        {isAuthenticated && <NavLink to="/orders">Orders</NavLink>}
        {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
      </nav>
      <div className="header-actions">
        {isAuthenticated ? <>
          <Link className="cart-link" to="/cart">Cart <span className="cart-count">{cartQuery.data?.item_count ?? 0}</span></Link>
          <span className="header-user">{user?.full_name.split(' ')[0]}</span>
          <button type="button" className="header-text-button" onClick={handleLogout}>Sign out</button>
        </> : <><Link className="header-text-button" to="/login">Sign in</Link><Link className="sign-in-link" to="/register">Create account</Link></>}
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <SiteHeader />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/cart" element={<CartPage />} />
            <Route path="/orders" element={<OrdersPage />} />
          </Route>
          <Route element={<ProtectedRoute requiredRole="admin" />} >
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Routes>
      </main>
      <footer className="site-footer"><span>© {new Date().getFullYear()} ShopPilot</span><span>Smarter shopping, thoughtfully built.</span></footer>
    </div>
  );
}

import { Link, NavLink } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getCart } from '../../features/cart/api';
export function Navbar({ open }: { open: () => void }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('shoppilot_theme') || 'editorial');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('shoppilot_theme', theme);
  }, [theme]);
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
        <NavLink to="/products">Collection</NavLink>
        <NavLink to="/assistant">AI Assistant</NavLink>
        {isAuthenticated && <NavLink to="/orders">Orders</NavLink>}
        {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
      </nav>
      <div className="header-actions">
        <button onClick={open} title="Ctrl or Cmd + K">Ask ShopPilot</button>
        <select aria-label="Storefront palette" value={theme} onChange={e => setTheme(e.target.value)}><option value="editorial">Editorial Alabaster</option><option value="swiss">Swiss Gallery</option><option value="matcha">Organic Matcha</option><option value="violet">Soft Cloud & Violet</option></select>
        {isAuthenticated ? <>
          <Link className="cart-link" to="/cart">Cart <span className="cart-count">{cartQuery.data?.item_count ?? 0}</span></Link>
          <span className="header-user">{user?.full_name.split(' ')[0]}</span>
          <button type="button" className="header-text-button" onClick={handleLogout}>Sign out</button>
        </> : <><Link className="header-text-button" to="/login">Sign in</Link><Link className="sign-in-link" to="/register">Create account</Link></>}
      </div>
    </header>
  );
}

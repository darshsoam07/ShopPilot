import { Link, NavLink, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCartDrawer } from '../../features/cart/CartDrawerContext';
import { getCart } from '../../features/cart/api';
export function Navbar({ open }: { open: () => void }) {
  const { openDrawer } = useCartDrawer();
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();
  useEffect(() => { setExpanded(false); }, [location.key]);
  const { user, logout, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const clearPrivateQueries = () => {
    queryClient.removeQueries({ queryKey: ['addresses'] });
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
      <Link to="/" className="brand"><span className="brand-mark" aria-hidden="true">S</span> ShopPilot</Link>
      <button className="menu-toggle" type="button" aria-expanded={expanded} aria-controls="store-navigation" onClick={() => setExpanded(!expanded)}>{expanded ? "Close menu" : "Menu"}</button>
      <div id="store-navigation" className="store-navigation" data-expanded={expanded}>
        <nav className="main-nav" aria-label="Main navigation">
          <NavLink to="/" end>Discover</NavLink>
          <NavLink to="/products">Collection</NavLink>
          <NavLink to="/assistant">AI Assistant</NavLink>
          {isAuthenticated && <><NavLink to="/orders">Orders</NavLink><NavLink to="/account/addresses">Addresses</NavLink></>}
          {user?.role === 'admin' && <><NavLink end to="/admin">Admin</NavLink><NavLink to="/admin/orders">Fulfillment</NavLink></>}
        </nav>
        <div className="header-actions">
          <form role="search" className="store-search" action="/products" method="get">
            <input type="search" name="q" aria-label="Search the collection" placeholder="Search products" maxLength={100} />
          </form>
          <button onClick={() => { setExpanded(false); open(); }} title="Ctrl or Cmd + K">Ask ShopPilot</button>
          {isAuthenticated ? <>
            <button className="cart-link" aria-haspopup="dialog" onClick={openDrawer}>Bag <span className="cart-count">{cartQuery.data?.item_count ?? 0}</span></button>
            <span className="header-user">{user?.full_name.split(' ')[0]}</span>
            <button type="button" className="header-text-button" onClick={handleLogout}>Sign out</button>
          </> : <><Link className="header-text-button" to="/login">Sign in</Link><Link className="sign-in-link" to="/register">Create account</Link></>}
        </div>
      </div>
    </header>
  );
}

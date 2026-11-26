import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, matchPath, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCartDrawer } from '../../features/cart/CartDrawerContext';
import { getCart } from '../../features/cart/api';
import { LAYOUT_ID, SPRING, TRANSITION, useHeaderCompaction } from '../../lib/motion';

function NavItem({ to, end, children }: { to: string; end?: boolean; children: ReactNode }) {
  return (
    <NavLink to={to} end={end}>
      {({ isActive }) => (
        <>
          <span>{children}</span>
          {isActive && <motion.span layoutId={LAYOUT_ID.navPill} className="main-nav__bar" transition={SPRING.indicator} aria-hidden="true" />}
        </>
      )}
    </NavLink>
  );
}

export function Navbar({ open }: { open: () => void }) {
  const { openDrawer } = useCartDrawer();
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();
  const compact = useHeaderCompaction();
  const { user, logout, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => { setExpanded(false); }, [location.key]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setExpanded(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);

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
  const count = cartQuery.data?.item_count ?? 0;
  // The product page has its own "Compare with ShopPilot" action; browser tests expect no trigger there.
  const onProductPage = !!matchPath('/products/:productId', location.pathname);

  return (
    <header className="site-header" data-compact={compact} data-admin={user?.role === 'admin' || undefined}>
      <div className="site-header__bar">
        <div className="container-editorial site-header__row">
          <Link to="/" className="brand"><span className="brand-mark" aria-hidden="true" />ShopPilot</Link>

          <div id="store-navigation" className="store-navigation" data-expanded={expanded} data-lenis-prevent>
            <LayoutGroup id="main-nav">
              <nav className="main-nav" aria-label="Main navigation">
                <NavItem to="/" end>Home</NavItem>
                <NavItem to="/products">Collection</NavItem>
                <NavItem to="/assistant">Assistant</NavItem>
                {isAuthenticated && <><NavItem to="/orders">Orders</NavItem><NavItem to="/account/addresses">Addresses</NavItem></>}
                {user?.role === 'admin' && <><NavItem to="/admin" end>Admin</NavItem><NavItem to="/admin/orders">Fulfillment</NavItem><NavItem to="/admin/after-sales">After-sales</NavItem></>}
              </nav>
            </LayoutGroup>
            <div className="header-actions">
              <form role="search" className="store-search" action="/products" method="get">
                <input type="search" name="q" aria-label="Search the collection" placeholder="Search products" maxLength={100} />
              </form>
              {isAuthenticated ? <>
                <span className="header-user">{user?.full_name.split(' ')[0]}</span>
                <button type="button" className="header-text-button" onClick={handleLogout}>Sign out</button>
              </> : <>
                <Link className="header-text-button" to="/login">Sign in</Link>
                <Link className="btn-primary header-cta" to="/register">Create account</Link>
              </>}
            </div>
          </div>

          <button type="button" className={'header-ask' + (onProductPage ? '' : ' copilot-trigger')} aria-label="Ask ShopPilot" aria-keyshortcuts="Control+K Meta+K"
            onClick={() => { setExpanded(false); open(); }} title="Ctrl or Cmd + K">
            <Search size={16} aria-hidden="true" /><span className="header-ask__label">Ask ShopPilot</span>
          </button>

          {isAuthenticated && (
            <button type="button" className="cart-link" aria-haspopup="dialog" aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`} onClick={openDrawer}>
              <span aria-hidden="true">Cart</span>
              <span className="cart-count tnum" aria-hidden="true">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span key={count} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={TRANSITION.ui}>{count}</motion.span>
                </AnimatePresence>
              </span>
            </button>
          )}
          <button className="menu-toggle" type="button" aria-expanded={expanded} aria-controls="store-navigation" onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Close menu' : 'Menu'}
          </button>
        </div>
      </div>
    </header>
  );
}

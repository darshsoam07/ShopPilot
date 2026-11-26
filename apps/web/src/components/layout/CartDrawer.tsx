import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, Minus, Plus, Trash2, X } from 'lucide-react';
import { useCartDrawer } from '../../features/cart/CartDrawerContext';
import { FreeShippingMeter } from '../../features/cart/FreeShippingMeter';
import { getCart, removeCartItem, updateCartItem } from '../../features/cart/api';
import { ProductImage } from '../../features/catalog/ProductImage';
import { resolveProductMedia } from '../../features/catalog/productMedia';
import { SPRING, TRANSITION } from '../../lib/motion';

/** Cart value that unlocks free shipping. Set VITE_FREE_SHIPPING_THRESHOLD to match the backend rule. */
const FREE_SHIPPING_THRESHOLD = Number(import.meta.env.VITE_FREE_SHIPPING_THRESHOLD) || undefined;

const rupees = (value: number) => '₹' + value.toLocaleString('en-IN');
const FOCUSABLE = 'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled)';

export function CartDrawer() {
  const { isOpen, closeDrawer } = useCartDrawer();
  const cache = useQueryClient();
  const cart = useQuery({ queryKey: ['cart'], queryFn: getCart, enabled: isOpen });
  const change = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity?: number }) => {
      if (quantity !== undefined) return updateCartItem(id, quantity);
      await removeCartItem(id);
      return getCart();
    },
    onSuccess: data => cache.setQueryData(['cart'], data),
    onError: () => cache.invalidateQueries({ queryKey: ['cart'] }),
  });

  const items = (cart.data?.items ?? []).map(({ id, quantity, product }) => ({
    id, quantity, productId: product.id, name: product.name, price: Number(product.price),
    sku: product.sku, stock: product.stock_quantity, image: resolveProductMedia(product).primary,
  }));
  const subtotal = Number(cart.data?.subtotal ?? 0);
  const units = items.reduce((sum, item) => sum + item.quantity, 0);
  const busy = change.isPending;
  const error = cart.error?.message ?? change.error?.message;
  const panel = useRef<HTMLElement>(null);

  // Focus moves in on open, is trapped while open, and returns to the opener on close.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement;
    panel.current?.querySelector<HTMLElement>('button')?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { closeDrawer(); return; }
      if (event.key !== 'Tab') return;
      const elements = panel.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!elements?.length) return;
      const first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [isOpen, closeDrawer]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div key="scrim" className="drawer-scrim" aria-hidden="true" onClick={closeDrawer}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={TRANSITION.ui} />
          <motion.aside key="panel" ref={panel} className="cart-drawer" role="dialog" aria-modal="true" aria-label="Cart"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={SPRING.drawer}>
            <header className="cart-drawer__header">
              <div>
                <h2 className="cart-drawer__title">Cart</h2>
                <p className="cart-drawer__count tnum">{units} {units === 1 ? 'item' : 'items'}</p>
              </div>
              <button type="button" className="icon-btn" onClick={closeDrawer} aria-label="Close cart"><X size={18} aria-hidden="true" /></button>
            </header>

            <FreeShippingMeter subtotal={subtotal} threshold={FREE_SHIPPING_THRESHOLD} />

            <div className="cart-drawer__body" data-lenis-prevent>
              {error && <p className="cart-drawer__error" role="alert">{error}</p>}
              {cart.isPending ? (
                <div role="status" aria-label="Loading your cart" className="cart-drawer__skeleton">
                  {[0, 1].map(row => <div key={row} className="skeleton cart-drawer__skeleton-row" />)}
                </div>
              ) : error && !items.length ? (
                <Link to="/cart" className="text-link" onClick={closeDrawer}>View the full cart</Link>
              ) : items.length === 0 ? (
                <div className="cart-drawer__empty">
                  <p>Your cart is empty.</p>
                  <Link to="/products" className="btn-ghost" onClick={closeDrawer}>Browse the collection</Link>
                </div>
              ) : (
                <ul className="cart-drawer__list">
                  <AnimatePresence initial={false} mode="popLayout">
                    {items.map(item => (
                      <motion.li key={item.id} layout="position" className="drawer-line"
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 24 }}
                        transition={TRANSITION.ui}>
                        <div className="drawer-line__thumb"><ProductImage url={item.image} name={item.name} /></div>
                        <div className="drawer-line__info">
                          <div className="drawer-line__top">
                            <Link to={`/products/${item.productId}`} onClick={closeDrawer} className="drawer-line__name">{item.name}</Link>
                            <span className="price tnum">{rupees(item.price * item.quantity)}</span>
                          </div>
                          <p className="drawer-line__sku">{item.sku}</p>
                          <div className="drawer-line__controls">
                            <div className="qty-stepper" role="group" aria-label={`Quantity for ${item.name}`}>
                              <button type="button" aria-label="Decrease quantity" disabled={busy || item.quantity <= 1}
                                onClick={() => change.mutate({ id: item.id, quantity: item.quantity - 1 })}><Minus size={12} aria-hidden="true" /></button>
                              <span className="tnum" aria-live="polite">{item.quantity}</span>
                              <button type="button" aria-label="Increase quantity" disabled={busy || item.quantity >= item.stock}
                                onClick={() => change.mutate({ id: item.id, quantity: item.quantity + 1 })}><Plus size={12} aria-hidden="true" /></button>
                            </div>
                            <button type="button" className="drawer-line__remove" disabled={busy} aria-label={`Remove ${item.name}`}
                              onClick={() => change.mutate({ id: item.id })}><Trash2 size={14} aria-hidden="true" /></button>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <footer className="cart-drawer__footer">
                <p className="cart-drawer__subtotal"><span>Subtotal</span><span className="price tnum">{rupees(subtotal)}</span></p>
                <Link to="/checkout" className="btn-primary cart-drawer__cta" onClick={closeDrawer}>
                  Continue to checkout <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
                <Link to="/cart" className="text-link" onClick={closeDrawer}>View the full cart</Link>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

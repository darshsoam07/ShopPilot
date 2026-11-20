// apps/web/src/components/layout/CartDrawer.tsx
import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { X, Minus, Plus, Trash2, ArrowUpRight } from "lucide-react";
import { useCartDrawer } from "../../features/cart/CartDrawerContext";
import { FreeShippingMeter } from "../../features/cart/FreeShippingMeter";
import { SPRING_DRAWER, EDITORIAL_EASE } from "../../lib/motion";

import { ProductImage } from "../../features/catalog/ProductImage";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCart, removeCartItem, updateCartItem } from "../../features/cart/api";
import { resolveProductMedia } from "../../features/catalog/productMedia";

export function CartDrawer() {
  const { isOpen, closeDrawer } = useCartDrawer();
  const cache = useQueryClient();
  const cart = useQuery({ queryKey: ["cart"], queryFn: getCart, enabled: isOpen });
  const change = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity?: number }) => {
      if (quantity !== undefined) return updateCartItem(id, quantity);
      await removeCartItem(id);
      return getCart();
    },
    onSuccess: data => cache.setQueryData(["cart"], data),
    onError: () => cache.invalidateQueries({ queryKey: ["cart"] }),
  });
  const items = (cart.data?.items ?? []).map(({ id, quantity, product }) => ({
    id, quantity, productId: product.id, name: product.name, price: Number(product.price),
    variantLabel: product.sku, stock: product.stock_quantity, image: resolveProductMedia(product).primary,
  }));
  const subtotal = Number(cart.data?.subtotal ?? 0);
  const busy = change.isPending;
  const loading = cart.isPending;
  const error = cart.error?.message ?? change.error?.message;
  const onUpdateQty = (id: number, quantity: number) => change.mutate({ id, quantity });
  const onRemove = (id: number) => change.mutate({ id });
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement;
    panel.current?.querySelector('button')?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        const elements = panel.current?.querySelectorAll<HTMLElement>("button:not(:disabled), a[href]");
        if (elements?.length) {
          const first = elements[0], last = elements[elements.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => { window.removeEventListener("keydown", onKeyDown); if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, [isOpen, closeDrawer]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={closeDrawer}
            aria-hidden="true"
          />

          <motion.aside ref={panel}
            className="cart-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping Bag"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={SPRING_DRAWER}
          >
            <header className="cart-drawer__header">
              <div>
                <h2 className="cart-drawer__title">Your Bag</h2>
                <span className="cart-drawer__count font-mono-tabular">
                  {items.reduce((sum, i) => sum + i.quantity, 0)} ITEMS
                </span>
              </div>
              <button type="button" className="icon-btn" onClick={closeDrawer} aria-label="Close bag">
                <X size={18} />
              </button>
            </header>

            <FreeShippingMeter subtotal={subtotal} />

            <div className="cart-drawer__body" data-lenis-prevent>
              {error && <p role="alert">{error}</p>}
              {loading ? <p role="status">Loading your bag…</p> : error && !items.length ? <Link to="/cart" onClick={closeDrawer}>View full bag</Link> : items.length === 0 ? (
                <div className="cart-drawer__empty">
                  <p>Your bag is currently empty.</p>
                  <Link to="/products" className="btn-ghost" onClick={closeDrawer}>
                    Browse Catalog
                  </Link>
                </div>
              ) : (
                <ul className="cart-drawer__list">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.li
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 24 }}
                        transition={{ duration: 0.22, ease: EDITORIAL_EASE }}
                        className="cart-item"
                      >
                        <div className="cart-item__thumb">
                          <ProductImage url={item.image ?? null} name={item.name} />
                        </div>
                        <div className="cart-item__info">
                          <div className="cart-item__top">
                            <Link to={`/products/${item.productId}`} onClick={closeDrawer} className="cart-item__name">
                              {item.name}
                            </Link>
                            <span className="font-mono-tabular cart-item__price">
                              ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                            </span>
                          </div>
                          {item.variantLabel && (
                            <span className="cart-item__variant">{item.variantLabel}</span>
                          )}
                          <div className="cart-item__controls">
                            <div className="qty-stepper">
                              <button
                                type="button"
                                onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                                disabled={busy || item.quantity <= 1}
                                aria-label="Decrease quantity"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="font-mono-tabular">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                                disabled={busy || item.quantity >= item.stock}
                                aria-label="Increase quantity"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                            <button
                              type="button"
                              disabled={busy}
                              className="cart-item__remove"
                              onClick={() => onRemove(item.id)}
                              aria-label={`Remove ${item.name}`}
                            >
                              <Trash2 size={14} />
                            </button>
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
                <div className="cart-drawer__subtotal">
                  <span>Subtotal</span>
                  <span className="font-mono-tabular">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="cart-drawer__actions">
                  <Link to="/checkout" className="btn-primary cart-drawer__cta" onClick={closeDrawer}>
                    <span>Proceed to Checkout</span>
                    <ArrowUpRight size={16} />
                  </Link>
                  <Link to="/cart" className="cart-drawer__fallback" onClick={closeDrawer}>
                    View full bag
                  </Link>
                </div>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

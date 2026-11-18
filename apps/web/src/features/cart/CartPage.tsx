import { ProductImage } from '../catalog/ProductImage';
import { resolveProductMedia } from '../catalog/productMedia';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getCart, removeCartItem, updateCartItem } from './api';
import type { Cart } from './types';


export function CartPage() {
  const queryClient = useQueryClient();
  const cartQuery = useQuery({ queryKey: ['cart'], queryFn: getCart });
  const refreshCart = async (cart: Cart) => queryClient.setQueryData(['cart'], cart);
  const removeMutation = useMutation({ mutationFn: removeCartItem, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }) });
  const updateMutation = useMutation({ mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) => updateCartItem(itemId, quantity), onSuccess: refreshCart });

  if (cartQuery.isPending) return <div className="state-panel">Loading your cart…</div>;
  if (cartQuery.isError) return <div className="state-panel error-state"><strong>Unable to load your cart.</strong><span>{cartQuery.error.message}</span></div>;
  const cart = cartQuery.data;

  return (
    <section className="page-section">
      <div className="page-heading"><p className="eyebrow">YOUR SELECTION</p><h1>Shopping cart</h1><p>Review quantities and confirm a delivery address.</p></div>
      {cart.items.length === 0 ? (
        <div className="state-panel">Your cart is empty. <Link to="/">Explore the catalogue</Link>.</div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cart.items.map((item) => (
              <article className="cart-item" key={item.id}>
                <div className="cart-item-image"><ProductImage url={resolveProductMedia(item.product).primary} name={item.product.name} /></div>
                <div className="cart-item-main"><strong>{item.product.name}</strong><small>{item.product.sku}</small><span>₹{Number(item.product.price).toLocaleString('en-IN')} each</span></div>
                <div className="cart-item-actions">
                  <label>Qty<select value={item.quantity} onChange={(event) => updateMutation.mutate({ itemId: item.id, quantity: Number(event.target.value) })}>{Array.from({ length: Math.min(item.product.stock_quantity, 10) }, (_, index) => index + 1).map((quantity) => <option key={quantity} value={quantity}>{quantity}</option>)}</select></label>
                  <button type="button" className="text-button" onClick={() => removeMutation.mutate(item.id)}>Remove</button>
                </div>
                <strong className="cart-line-total">₹{(Number(item.product.price) * item.quantity).toLocaleString('en-IN')}</strong>
              </article>
            ))}
            <div className="cart-subtotal"><span>{cart.item_count} item(s)</span><strong>Subtotal: ₹{Number(cart.subtotal).toLocaleString('en-IN')}</strong></div>
          </div>
          <aside><Link to="/checkout" className="primary-button">Continue to checkout</Link></aside>
        </div>
      )}
    </section>
  );
}

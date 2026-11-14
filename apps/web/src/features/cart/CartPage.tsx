import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getCart, removeCartItem, updateCartItem } from './api';
import { postJson } from '../../services/http';
import type { Cart } from './types';

interface OrderResult { id: number; total_amount: string; status: string }

export function CartPage() {
  const queryClient = useQueryClient();
  const cartQuery = useQuery({ queryKey: ['cart'], queryFn: getCart });
  const [formError, setFormError] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const refreshCart = async (cart: Cart) => queryClient.setQueryData(['cart'], cart);
  const removeMutation = useMutation({ mutationFn: removeCartItem, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }) });
  const updateMutation = useMutation({ mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) => updateCartItem(itemId, quantity), onSuccess: refreshCart });

  async function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const shipping_address = {
      recipient_name: String(form.get('recipient_name') ?? ''),
      phone: String(form.get('phone') ?? ''),
      address_line1: String(form.get('address_line1') ?? ''),
      address_line2: String(form.get('address_line2') ?? '') || null,
      city: String(form.get('city') ?? ''),
      state: String(form.get('state') ?? ''),
      postal_code: String(form.get('postal_code') ?? ''),
      country: String(form.get('country') ?? 'India'),
    };
    setFormError('');
    setIsCheckingOut(true);
    try {
      const order = await postJson<OrderResult>('/api/v1/orders/checkout', { shipping_address });
      await queryClient.invalidateQueries({ queryKey: ['cart'] });
      await queryClient.invalidateQueries({ queryKey: ['orders'] });
      window.location.assign(`/orders?placed=${order.id}`);
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'Checkout failed. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  }

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
                <div className="cart-item-image">{item.product.image_url ? <img src={item.product.image_url} alt={item.product.name} /> : 'Product'}</div>
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
          <form className="checkout-panel" onSubmit={checkout}>
            <p className="eyebrow">DELIVERY DETAILS</p><h2>Checkout</h2>
            <label>Recipient name<input name="recipient_name" minLength={2} required /></label>
            <label>Phone number<input name="phone" type="tel" minLength={7} maxLength={20} required /></label>
            <label>Address line 1<input name="address_line1" minLength={3} required /></label>
            <label>Address line 2 <span>(optional)</span><input name="address_line2" /></label>
            <div className="checkout-fields"><label>City<input name="city" required /></label><label>State<input name="state" required /></label></div>
            <div className="checkout-fields"><label>Postal code<input name="postal_code" required /></label><label>Country<input name="country" defaultValue="India" required /></label></div>
            {formError && <div className="form-error" role="alert">{formError}</div>}
            <button className="primary-button auth-submit" type="submit" disabled={isCheckingOut || updateMutation.isPending || removeMutation.isPending}>{isCheckingOut ? 'Placing order…' : 'Place order · ₹' + Number(cart.subtotal).toLocaleString('en-IN')}</button>
            <small className="checkout-note">Demo checkout only. No real payment is collected.</small>
          </form>
        </div>
      )}
    </section>
  );
}

import { CheckoutStepper } from './CheckoutStepper';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { getCart } from '../cart/api';
import { submitCheckoutOrder, validateCouponCode } from './api';
import type { CheckoutPayload } from './types';

export function CheckoutPage() {
  const cart = useQuery({ queryKey: ['cart'], queryFn: getCart });
  const client = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [shipping, setShipping] = useState({ full_name: '', address: '', city: '', postal_code: '' });
  const fees = { DHL: 15.99, FedEx: 9.99, GLS: 7.99 };
  const [carrier, setCarrier] = useState<keyof typeof fees>('FedEx');
  const [decline, setDecline] = useState(false);
  const [sameBilling, setSameBilling] = useState(true);
  const [billing, setBilling] = useState('');
  const [country, setCountry] = useState('India');
  const [phone, setPhone] = useState('');
  const [payment, setPayment] = useState<CheckoutPayload['payment_method']>('card');
  const [code, setCode] = useState('');
  const quote = useMutation({ mutationFn: (input: { code: string; subtotal: string }) => validateCouponCode(input.code, input.subtotal) });
  const applied = quote.variables?.code === code && quote.variables?.subtotal === cart.data?.subtotal ? quote.data : undefined;
  const place = useMutation({
    mutationFn: () => submitCheckoutOrder({ shipping: { ...shipping, country, phone, billing_address: sameBilling ? undefined : billing }, carrier, simulate_failure: decline, payment_method: payment, coupon_code: applied?.valid ? applied.code : undefined }),
    onSuccess: order => {
      void client.invalidateQueries({ queryKey: ['cart'] });
      void client.invalidateQueries({ queryKey: ['orders'] });
      navigate('/orders?placed=' + order.id);
    }
  });
  if (!cart.data) return <p className="state-panel">{cart.error?.message ?? 'Loading cart…'}</p>;
  if (!cart.data.items.length) return <p className="state-panel">Your cart is empty. <Link to="/">Browse products</Link></p>;
  const total = (Number(applied?.final_total ?? cart.data.subtotal) + fees[carrier]).toFixed(2);
  return <section className="page-section checkout-reference"><h1>Checkout</h1>
    <CheckoutStepper currentStep={step} onStepSelect={place.isPending ? undefined : setStep} />
    <div className="checkout-columns"><div className="checkout-panel">
    {step === 1 && <form onSubmit={e => { e.preventDefault(); setStep(2); }}><h2>Delivery details</h2>
      {(['full_name','address','city','postal_code'] as const).map((key,i) => <label key={key}>{['Recipient name','Street address','City','Postal code'][i]}
        <input required minLength={[2,5,2,3][i]} maxLength={[120,255,100,32][i]} value={shipping[key]} onChange={e => setShipping({ ...shipping, [key]: e.target.value })} /></label>)}
      <label>Country<input required value={country} onChange={e => setCountry(e.target.value)} /></label>
      <label>Phone number<input type="tel" minLength={7} maxLength={20} required value={phone} onChange={e => setPhone(e.target.value)} /></label>
      <label><input type="checkbox" checked={sameBilling} onChange={e => setSameBilling(e.target.checked)} /> Use delivery address for billing</label>
      {!sameBilling && <label>Billing address<input required maxLength={255} value={billing} onChange={e => setBilling(e.target.value)} /></label>}
      <fieldset className="carrier-options"><legend>Delivery method</legend>{(Object.keys(fees) as Array<keyof typeof fees>).map(name =>
        <label key={name}><input type="radio" name="carrier" checked={carrier === name} onChange={() => setCarrier(name)} />{name} · ₹{fees[name]}</label>)}</fieldset>
      <button className="primary-button">Continue to payment</button></form>}
    {step === 2 && <><h2>Demo payment</h2>
      <label>Payment method<select value={payment} onChange={e => setPayment(e.target.value as CheckoutPayload['payment_method'])}><option value="card">Card</option><option value="upi">UPI</option><option value="cod">Cash on delivery</option></select></label>
      <label>Demo gateway result<select value={decline ? 'decline' : 'success'} onChange={e => setDecline(e.target.value === 'decline')}><option value="success">Approve payment</option><option value="decline">Decline payment</option></select></label>
      <label>Promo code<input maxLength={32} placeholder="SHOPPILOT10 or AI20" value={code} onChange={e => setCode(e.target.value)} /></label>
      <button disabled={!code.trim() || quote.isPending} onClick={() => quote.mutate({ code, subtotal: cart.data.subtotal })}>Apply code</button>
      <p role="status">{applied?.message ?? quote.error?.message}</p>
      <button onClick={() => setStep(1)}>Back</button> <button disabled={!!code && !applied?.valid} onClick={() => setStep(3)}>Review order</button></>}
    {step === 3 && <><h2>Review order</h2><p>{Object.values(shipping).join(', ')}</p><p>{payment.toUpperCase()} · Simulated payment</p>
      {cart.data.items.map(item => <p key={item.id}>{item.product.name} × {item.quantity}</p>)}
      <p>Subtotal ₹{cart.data.subtotal} · Discount ₹{applied?.discount_amount ?? '0.00'}</p>
      <button disabled={place.isPending} onClick={() => setStep(2)}>Back</button> <button className="primary-button" disabled={place.isPending || (!!code && !applied?.valid)} onClick={() => place.mutate()}>Place order · ₹{total}</button>
      {place.error && <p role="alert">{place.error.message}</p>}</>}
  </div><aside className="checkout-summary"><h2>Order summary</h2><table><thead><tr><th>Product</th><th>Qty</th><th>Price</th></tr></thead><tbody>
    {cart.data.items.map(item => <tr key={item.id}><td>{item.product.name}<small style={{display: 'block'}}>{item.product.sku} · {[item.product.specifications?.Finish, item.product.specifications?.Configuration, item.product.specifications?.Protection].filter(Boolean).join(' · ')}</small></td><td>{item.quantity}</td><td>₹{(Number(item.product.price)*item.quantity).toFixed(2)}</td></tr>)}</tbody></table>
    <p>Subtotal <strong>₹{cart.data.subtotal}</strong></p><p>Shipping · {carrier} <strong>₹{fees[carrier]}</strong></p>
    {applied?.valid && <p>Discount <strong>−₹{applied.discount_amount}</strong></p>}<p>Total <strong>₹{total}</strong></p>
    <Link to="/cart">Edit cart</Link></aside></div></section>;
}


import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { addressUrl, useAddresses, type Address } from './AddressesPage';
import { ApiError, postJson } from '../../services/http';
import { getCart } from '../cart/api';
import { submitCheckoutOrder, validateCouponCode } from './api';
import type { CheckoutPayload } from './types';

export function CheckoutPage() {
  const cart = useQuery({ queryKey: ['cart'], queryFn: getCart });
  const client = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
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
  const addresses = useAddresses();
  const [choice, setChoice] = useState<string>();
  const selectedId = choice ?? String(addresses.data?.find(a => a.is_default)?.id ?? '');
  const selected = addresses.data?.find(a => String(a.id) === selectedId);
  const [saveAddress,setSaveAddress] = useState(false);
  const save = useMutation({
    mutationFn: () => postJson<Address>(addressUrl,{details:{recipient_name:shipping.full_name,address_line1:shipping.address,
      city:shipping.city,postal_code:shipping.postal_code,country,phone}}),
    onSuccess: async address => {
      await client.invalidateQueries({queryKey:['addresses']});
      setChoice(String(address.id)); setSaveAddress(false); setStep(2);
    }
  });
  const attempt = useRef<{signature:string; key:string} | null>(null);
  const place = useMutation({
    mutationFn: () => {
      const payload = { ...(selected ? {address_id:selected.id,billing_address:sameBilling ? undefined : billing} : {shipping:{...shipping,country,phone,billing_address:sameBilling ? undefined : billing}}),
        carrier, simulate_failure:payment !== 'cod' && decline, payment_method:payment, coupon_code:applied?.valid ? applied.code : undefined };
      const signature = JSON.stringify(payload);
      if (attempt.current?.signature !== signature) attempt.current = {signature,key:crypto.randomUUID()};
      return submitCheckoutOrder({...payload,idempotency_key:attempt.current.key});
    },
    onError: error => { if (error instanceof ApiError && error.status === 402) attempt.current = null; },
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
    <ol className="checkout-progress">{['Sign in','Address details','Payment method','Preview & confirm'].map((label,i) =>
      <li key={label} data-active={i <= step} aria-current={i === step ? 'step' : undefined}>{label}</li>)}</ol>
    <div className="checkout-columns"><div className="checkout-panel">
    {step === 1 && <form onSubmit={e => { e.preventDefault(); if(!selected && saveAddress) save.mutate(); else setStep(2); }}><h2>Delivery details</h2>
      <label>Delivery address<select value={selectedId} onChange={e=>setChoice(e.target.value)}><option value="">Enter a new address</option>
        {addresses.data?.map(a=><option key={a.id} value={a.id}>{a.details.recipient_name} � {a.details.address_line1}{a.is_default ? ' (default)' : ''}</option>)}</select></label>
      {selected ? <address>{Object.values(selected.details).filter(Boolean).join(', ')}</address> : <>
      {(['full_name','address','city','postal_code'] as const).map((key,i) => <label key={key}>{['Recipient name','Street address','City','Postal code'][i]}
        <input required minLength={[2,5,2,3][i]} maxLength={[120,255,100,32][i]} value={shipping[key]} onChange={e => setShipping({ ...shipping, [key]: e.target.value })} /></label>)}
      <label>Country<input required value={country} onChange={e => setCountry(e.target.value)} /></label>
      <label>Phone number<input type="tel" minLength={7} maxLength={20} required value={phone} onChange={e => setPhone(e.target.value)} /></label>
      <label><input type="checkbox" checked={saveAddress} onChange={e=>setSaveAddress(e.target.checked)}/>Save this delivery address</label></>}
      <label><input type="checkbox" checked={sameBilling} onChange={e => setSameBilling(e.target.checked)} /> Use delivery address for billing</label>
      {!sameBilling && <label>Billing address<input required maxLength={255} value={billing} onChange={e => setBilling(e.target.value)} /></label>}

      {save.isError && <p role="alert">{save.error.message}</p>}
      <fieldset className="carrier-options"><legend>Delivery method</legend>{(Object.keys(fees) as Array<keyof typeof fees>).map(name =>
        <label key={name}><input type="radio" name="carrier" checked={carrier === name} onChange={() => setCarrier(name)} />{name} · ₹{fees[name]}</label>)}</fieldset>
      <button disabled={save.isPending || addresses.isPending} className="primary-button">Continue to payment</button></form>}
    {step === 2 && <><h2>Demo payment</h2><p>Payments are simulated. No money or payment credentials are collected.</p>
      <label>Payment method<select value={payment} onChange={e => setPayment(e.target.value as CheckoutPayload['payment_method'])}><option value="card">Card</option><option value="upi">UPI</option><option value="cod">Cash on delivery</option></select></label>
      {payment !== 'cod' && <label>Demo gateway result<select value={decline ? 'decline' : 'success'} onChange={e => setDecline(e.target.value === 'decline')}><option value="success">Approve payment</option><option value="decline">Decline payment</option></select></label>}
      <label>Promo code<input maxLength={32} placeholder="SHOPPILOT10 or AI20" value={code} onChange={e => setCode(e.target.value)} /></label>
      <button disabled={!code.trim() || quote.isPending} onClick={() => quote.mutate({ code, subtotal: cart.data.subtotal })}>Apply code</button>
      <p role="status">{applied?.message ?? quote.error?.message}</p>
      <button onClick={() => setStep(1)}>Back</button> <button disabled={!!code && !applied?.valid} onClick={() => setStep(3)}>Review order</button></>}
    {step === 3 && <><h2>Review order</h2><p>{Object.values(selected?.details ?? shipping).filter(Boolean).join(', ')}</p><p>{payment.toUpperCase()} · Simulated payment</p>
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


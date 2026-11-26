import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { TRANSITION } from '../../lib/motion';
import { ApiError, postJson } from '../../services/http';
import { getCart } from '../cart/api';
import { addressUrl, useAddresses, type Address } from './AddressesPage';
import { submitCheckoutOrder, validateCouponCode } from './api';
import { CheckoutStepper } from './CheckoutStepper';
import type { CheckoutPayload } from './types';

const FEES = { DHL: 15.99, FedEx: 9.99, GLS: 7.99 } as const;
type Carrier = keyof typeof FEES;

const PAYMENT_NOTES: Record<CheckoutPayload['payment_method'], string> = {
  card: 'Card payments are simulated. No card details are collected.',
  upi: 'UPI payments are simulated. No UPI details are collected.',
  cod: 'Pay the courier when the order arrives. Nothing is charged now.',
};

function Field({ label, children }: { label: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return <div className="field"><label htmlFor={id}>{label}</label>{children(id)}</div>;
}

/** One step of the flow. Fades in; focus moves to its heading once the person has navigated. */
function StepPanel({ heading, focus, children }: { heading: string; focus: boolean; children: ReactNode }) {
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (focus) title.current?.focus({ preventScroll: true }); }, [focus]);
  return (
    <motion.div className="checkout-step-panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={TRANSITION.ui}>
      <h2 tabIndex={-1} ref={title}>{heading}</h2>
      {children}
    </motion.div>
  );
}

const rupees = (value: number | string) => '₹' + Number(value).toFixed(2);

export function CheckoutPage() {
  const cart = useQuery({ queryKey: ['cart'], queryFn: getCart });
  const client = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const navigated = useRef(false);
  const goTo = (next: 1 | 2 | 3) => { navigated.current = true; setStep(next); };
  const [shipping, setShipping] = useState({ full_name: '', address: '', city: '', postal_code: '' });
  const [carrier, setCarrier] = useState<Carrier>('FedEx');
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
  const [saveAddress, setSaveAddress] = useState(false);
  const save = useMutation({
    mutationFn: () => postJson<Address>(addressUrl, { details: { recipient_name: shipping.full_name, address_line1: shipping.address,
      city: shipping.city, postal_code: shipping.postal_code, country, phone } }),
    onSuccess: async address => {
      await client.invalidateQueries({ queryKey: ['addresses'] });
      setChoice(String(address.id)); setSaveAddress(false); goTo(2);
    },
  });
  const attempt = useRef<{ signature: string; key: string } | null>(null);
  const place = useMutation({
    mutationFn: () => {
      const payload = { ...(selected ? { address_id: selected.id, billing_address: sameBilling ? undefined : billing }
        : { shipping: { ...shipping, country, phone, billing_address: sameBilling ? undefined : billing } }),
        carrier, simulate_failure: payment !== 'cod' && decline, payment_method: payment, coupon_code: applied?.valid ? applied.code : undefined };
      const signature = JSON.stringify(payload);
      if (attempt.current?.signature !== signature) attempt.current = { signature, key: crypto.randomUUID() };
      return submitCheckoutOrder({ ...payload, idempotency_key: attempt.current.key });
    },
    onError: error => { if (error instanceof ApiError && error.status === 402) attempt.current = null; },
    onSuccess: order => {
      void client.invalidateQueries({ queryKey: ['cart'] });
      void client.invalidateQueries({ queryKey: ['orders'] });
      navigate('/orders?placed=' + order.id);
    },
  });

  if (cart.isPending) {
    return (
      <section className="page-section checkout-reference" role="status" aria-label="Loading checkout">
        <div className="skeleton checkout-skeleton-title" />
        <div className="checkout-columns" aria-hidden="true"><div className="skeleton checkout-skeleton-panel" /><div className="skeleton checkout-skeleton-panel" /></div>
      </section>
    );
  }
  if (!cart.data) {
    return (
      <section className="state-panel error-state" role="alert">
        <strong>Couldn’t load your cart.</strong>
        <span>{cart.error?.message}</span>
        <button type="button" onClick={() => cart.refetch()}>Retry</button>
      </section>
    );
  }
  if (!cart.data.items.length) return <p className="state-panel">Your cart is empty. <Link to="/products">Browse products</Link></p>;

  const estimatedTotal = (Number(applied?.final_total ?? cart.data.subtotal) + FEES[carrier]).toFixed(2);
  const couponBlocks = !!code && !applied?.valid;

  return (
    <section className="page-section checkout-reference">
      <h1>Checkout</h1>
      <CheckoutStepper currentStep={step} onStepSelect={place.isPending ? undefined : goTo} />
      <div className="checkout-columns">
        <div className="checkout-flow">
          <AnimatePresence mode="wait" initial={false}>
            {step === 1 && (
              <StepPanel key="shipping" heading="Delivery details" focus={navigated.current}>
                <form onSubmit={event => { event.preventDefault(); if (!selected && saveAddress) save.mutate(); else goTo(2); }}>
                  <Field label="Delivery address">{id => (
                    <select id={id} value={selectedId} onChange={event => setChoice(event.target.value)}>
                      <option value="">Enter a new address</option>
                      {addresses.data?.map(a => <option key={a.id} value={a.id}>{a.details.recipient_name} · {a.details.address_line1}{a.is_default ? ' (default)' : ''}</option>)}
                    </select>
                  )}</Field>
                  {addresses.isError && <p className="inline-error" role="alert">Saved addresses couldn’t be loaded. You can enter a new one.</p>}
                  {selected ? (
                    <address className="address-card">{Object.values(selected.details).filter(Boolean).join(', ')}</address>
                  ) : (
                    <>
                      {(['full_name', 'address', 'city', 'postal_code'] as const).map((key, i) => (
                        <Field key={key} label={['Recipient name', 'Street address', 'City', 'Postal code'][i]}>{id => (
                          <input id={id} required minLength={[2, 5, 2, 3][i]} maxLength={[120, 255, 100, 32][i]} value={shipping[key]}
                            onChange={event => setShipping({ ...shipping, [key]: event.target.value })} />
                        )}</Field>
                      ))}
                      <Field label="Country">{id => <input id={id} required value={country} onChange={event => setCountry(event.target.value)} />}</Field>
                      <Field label="Phone number">{id => <input id={id} type="tel" minLength={7} maxLength={20} required value={phone} onChange={event => setPhone(event.target.value)} />}</Field>
                      <label className="check"><input type="checkbox" checked={saveAddress} onChange={event => setSaveAddress(event.target.checked)} />Save this delivery address</label>
                    </>
                  )}
                  <label className="check"><input type="checkbox" checked={sameBilling} onChange={event => setSameBilling(event.target.checked)} /> Use delivery address for billing</label>
                  {!sameBilling && <Field label="Billing address">{id => <input id={id} required maxLength={255} value={billing} onChange={event => setBilling(event.target.value)} />}</Field>}
                  {save.isError && <p role="alert" className="inline-error">{save.error.message}</p>}

                  <fieldset className="carrier-options">
                    <legend>Delivery method</legend>
                    {(Object.keys(FEES) as Carrier[]).map(name => (
                      <label key={name} className="choice-card" data-checked={carrier === name || undefined}>
                        <input type="radio" name="carrier" checked={carrier === name} onChange={() => setCarrier(name)} />
                        <span className="choice-card__name">{name}</span>
                        <span className="choice-card__meta tnum">₹{FEES[name]}</span>
                      </label>
                    ))}
                  </fieldset>
                  <div className="checkout-actions">
                    <button disabled={save.isPending || addresses.isPending} className="btn-primary">Continue to payment</button>
                  </div>
                </form>
              </StepPanel>
            )}

            {step === 2 && (
              <StepPanel key="payment" heading="Demo payment" focus={navigated.current}>
                <p className="checkout-lead">Payments are simulated. No money or payment credentials are collected.</p>
                <Field label="Payment method">{id => (
                  <select id={id} value={payment} onChange={event => setPayment(event.target.value as CheckoutPayload['payment_method'])}>
                    <option value="card">Card</option><option value="upi">UPI</option><option value="cod">Cash on delivery</option>
                  </select>
                )}</Field>
                <p className="choice-note">{PAYMENT_NOTES[payment]}</p>
                {payment !== 'cod' && (
                  <Field label="Demo gateway result">{id => (
                    <select id={id} value={decline ? 'decline' : 'success'} onChange={event => setDecline(event.target.value === 'decline')}>
                      <option value="success">Approve payment</option><option value="decline">Decline payment</option>
                    </select>
                  )}</Field>
                )}
                <div className="promo">
                  <Field label="Promo code">{id => <input id={id} maxLength={32} placeholder="SHOPPILOT10 or AI20" value={code} onChange={event => setCode(event.target.value)} />}</Field>
                  <button type="button" className="btn-ghost" disabled={!code.trim() || quote.isPending}
                    onClick={() => quote.mutate({ code, subtotal: cart.data.subtotal })}>Apply code</button>
                </div>
                <p role="status" className="promo__status">{applied?.message ?? quote.error?.message}</p>
                <div className="checkout-actions">
                  <button type="button" className="btn-ghost" onClick={() => goTo(1)}><ArrowLeft size={15} aria-hidden="true" />Back</button>
                  <button type="button" className="btn-primary" disabled={couponBlocks} onClick={() => goTo(3)}>Review order</button>
                </div>
              </StepPanel>
            )}

            {step === 3 && (
              <StepPanel key="review" heading="Review order" focus={navigated.current}>
                <dl className="review-list">
                  <div><dt>Deliver to</dt><dd>{Object.values(selected?.details ?? shipping).filter(Boolean).join(', ')}</dd></div>
                  <div><dt>Payment</dt><dd>{payment.toUpperCase()} · Simulated payment</dd></div>
                  <div><dt>Delivery</dt><dd>{carrier}</dd></div>
                </dl>
                <ul className="review-items">
                  {cart.data.items.map(item => <li key={item.id}>{item.product.name} <span className="tnum">× {item.quantity}</span></li>)}
                </ul>
                <p className="review-totals tnum">Subtotal {rupees(cart.data.subtotal)} · Discount {rupees(applied?.discount_amount ?? 0)}</p>
                <div className="checkout-actions">
                  <button type="button" className="btn-ghost" disabled={place.isPending} onClick={() => goTo(2)}><ArrowLeft size={15} aria-hidden="true" />Back</button>
                  <button type="button" className="btn-primary" disabled={place.isPending || couponBlocks} onClick={() => place.mutate()}>
                    Place order · <span className="tnum">₹{estimatedTotal}</span>
                  </button>
                </div>
                {place.error && <p role="alert" className="inline-error">{place.error.message}</p>}
              </StepPanel>
            )}
          </AnimatePresence>
        </div>

        <aside className="checkout-summary" aria-labelledby="summary-title">
          <h2 id="summary-title">Order summary</h2>
          <table>
            <thead><tr><th scope="col">Product</th><th scope="col">Qty</th><th scope="col">Price</th></tr></thead>
            <tbody>
              {cart.data.items.map(item => (
                <tr key={item.id}>
                  <td>{item.product.name}<small>{item.product.sku} · {[item.product.specifications?.Finish, item.product.specifications?.Configuration, item.product.specifications?.Protection].filter(Boolean).join(' · ')}</small></td>
                  <td className="tnum">{item.quantity}</td>
                  <td className="tnum">{rupees(Number(item.product.price) * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <dl className="summary-lines tnum">
            <div><dt>Subtotal</dt><dd>{rupees(cart.data.subtotal)}</dd></div>
            <div><dt>Shipping · {carrier}</dt><dd>₹{FEES[carrier]}</dd></div>
            {applied?.valid && <div><dt>Discount</dt><dd>−{rupees(applied.discount_amount)}</dd></div>}
            <div className="summary-lines__total"><dt>Estimated total</dt><dd>₹{estimatedTotal}</dd></div>
          </dl>
          <p className="summary-note">The final amount is calculated by the server when you place the order.</p>
          <Link to="/cart" className="text-link">Edit cart</Link>
        </aside>
      </div>
    </section>
  );
}

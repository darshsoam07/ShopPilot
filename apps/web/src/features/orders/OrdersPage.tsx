import { flushSync } from 'react-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { getOrders } from './api';

export function OrdersPage() {
  const [printId, setPrintId] = useState<number>();
  const stages = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  const ordersQuery = useQuery({ queryKey: ['orders'], queryFn: getOrders });
  const [searchParams] = useSearchParams();
  const placedId = searchParams.get('placed');

  if (ordersQuery.isPending) return <div className="state-panel">Loading your orders…</div>;
  if (ordersQuery.isError) return <div className="state-panel error-state"><strong>Unable to load orders.</strong><span>{ordersQuery.error.message}</span></div>;

  return (
    <section className="page-section">
      <div className="page-heading"><p className="eyebrow">YOUR PURCHASES</p><h1>Order history</h1><p>Orders placed using your ShopPilot account.</p></div>
      {placedId && <div className="success-note">Order #{placedId} has been placed successfully. This is a demo order; no payment was collected.</div>}
      {ordersQuery.data.items.length === 0 ? <div className="state-panel">You have not placed any orders yet. <Link to="/">Browse products</Link>.</div> : (
        <div className="orders-list customer-order-history">
          {ordersQuery.data.items.map((order) => (
            <article data-print={printId === order.id} className="order-card" key={order.id}>
              <div className="order-card-heading"><div><small>ORDER #{order.id}</small><strong>{new Date(order.created_at).toLocaleString()}</strong></div><span className="order-status">{order.status}</span></div>
              <div className="order-card-items">{order.items.map((item) => <div key={item.id}><span>{item.product_name} ({item.sku}) × {item.quantity}</span><strong>₹{Number(item.line_total).toLocaleString('en-IN')}</strong></div>)}</div>
              <p>Receipt {order.receipt_number ?? '#' + order.id} · {order.payment_method.toUpperCase()}</p>
              {order.payment && <p>Payment {order.payment.status} � {order.payment.reference}</p>}
              <address>{Object.values(order.shipping_address).filter(Boolean).join(', ')}</address>
              <ol className="order-stages">{stages.map((stage, index) => <li key={stage} aria-current={stage === order.status ? 'step' : undefined}
                data-done={index <= stages.indexOf(order.status)}>{stage === 'PAID' && order.payment_method === 'cod' ? 'Pay on delivery' : stage}</li>)}</ol>
              <p>Subtotal ₹{order.subtotal_amount ?? order.total_amount} · Shipping ₹{order.shipping_cost} · Discount ₹{order.discount_amount} {order.coupon_code}</p>
              <div className="order-total"><span>Total</span><strong>₹{Number(order.total_amount).toLocaleString('en-IN')}</strong></div>
              <div className="receipt-actions">
                <button onClick={() => { flushSync(() => setPrintId(order.id)); window.print(); }}>Print receipt</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}


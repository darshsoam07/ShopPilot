import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getJson, patchJson } from '../../services/http';
import type { Order, OrderList } from '../orders/types';

const nextStatus: Record<string, string> = { placed: 'PROCESSING', PAID: 'PROCESSING', PROCESSING: 'SHIPPED', SHIPPED: 'DELIVERED' };
const limit = 20;

export function AdminOrdersPage() {
  const [status, setStatus] = useState('');
  const [offset, setOffset] = useState(0);
  const cache = useQueryClient();
  const orders = useQuery({
    queryKey: ['admin-orders', status, offset],
    queryFn: () => getJson<OrderList>(`/api/v1/admin/orders?limit=${limit}&offset=${offset}${status ? '&status=' + status : ''}`),
  });
  const change = useMutation({
    mutationFn: (order: Order) => patchJson<Order>(`/api/v1/admin/orders/${order.id}/status`, { status: nextStatus[order.status] }),
    onSettled: async () => {
      await Promise.all(['admin-orders', 'orders'].map(key => cache.invalidateQueries({ queryKey: [key] })));
    },
  });
  return <section className="page-section">
    <h1>Order fulfillment</h1>
    <label>Order status <select value={status} onChange={event => { setStatus(event.target.value); setOffset(0); }}>
      <option value="">All statuses</option>
      {['placed', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(s => <option key={s}>{s}</option>)}
    </select></label>
    {change.isError && <p role="alert">{change.error.message}</p>}
    {change.isSuccess && <p role="status">Order #{change.data.id} updated to {change.data.status}.</p>}
    {orders.isPending && <p role="status">Loading orders…</p>}
    {orders.isError && <p role="alert">{orders.error.message} <button onClick={() => orders.refetch()}>Retry</button></p>}
    {orders.data && <>
      <p>{orders.data.total} matching orders</p>
      {!orders.data.items.length && <p>No orders on this page.</p>}
      <div className="orders-list">{orders.data.items.map(order => <article className="order-card" key={order.id}>
        <div className="order-card-heading"><h2>Order #{order.id}</h2><span className="order-status">{order.status}</span></div>
        <p>{new Date(order.created_at).toLocaleString()} · Receipt {order.receipt_number ?? order.id}</p>
        <address>{Object.values(order.shipping_address).filter(Boolean).join(', ')}</address>
        <ul>{order.items.map(item => <li key={item.id}>{item.product_name} ({item.sku}) × {item.quantity} · {order.currency} {item.line_total}</li>)}</ul>
        <p>Subtotal {order.subtotal_amount ?? order.total_amount} · Shipping {order.shipping_cost} · Discount {order.discount_amount}</p>
        <p>Total {order.currency} {order.total_amount} · {order.payment_method.toUpperCase()}</p>
        {nextStatus[order.status] && <button className="primary-button" disabled={change.isPending} onClick={() => change.mutate(order)}>Mark as {nextStatus[order.status]}</button>}
      </article>)}</div>
      <nav aria-label="Order pages"><button disabled={!offset} onClick={() => setOffset(offset - limit)}>Previous</button>
        <button disabled={offset + limit >= orders.data.total} onClick={() => setOffset(offset + limit)}>Next</button></nav>
    </>}
  </section>;
}

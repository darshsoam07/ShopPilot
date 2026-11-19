import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getJson, patchJson, postJson } from '../../services/http';
import { useAuth } from '../../context/AuthContext';
import type { Order } from './types';

interface ServiceRequest {
  id: number; order_id: number; kind: string; status: string; reason: string;
  created_at: string; decided_at: string | null; received_at: string | null; completed_at: string | null;
  refund: { amount: string; currency: string; reference: string; status: string } | null;
}
interface QueueEntry extends ServiceRequest {
  customer_id: number; payment_status: string; items: string[];
}
function RequestDetails({ row }: { row: ServiceRequest }) {
  return <div><strong>{row.kind} · {row.status}</strong><p>{row.reason}</p>
    {row.refund && <p>Simulated refund {row.refund.status} · {row.refund.currency} {row.refund.amount} · {row.refund.reference}</p>}
  </div>;
}
function useRefresh() {
  const cache = useQueryClient();
  return () => Promise.all(['after-sales', 'admin-after-sales', 'orders', 'admin-orders'].map(key =>
    cache.invalidateQueries({ queryKey: [key] })));
}

export function OrderAfterSales({ order }: { order: Order }) {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const refresh = useRefresh();
  const requests = useQuery({ queryKey: ['after-sales', user?.id], queryFn: () => getJson<ServiceRequest[]>('/api/v1/after-sales') });
  const create = useMutation({
    mutationFn: () => postJson('/api/v1/orders/' + order.id + '/after-sales', { kind: order.eligible_request, reason: reason.trim() }),
    onSettled: refresh,
  });
  if (requests.isPending) return <p>Loading requests…</p>;
  if (requests.isError) return <p role="alert">{requests.error.message}</p>;
  const history = requests.data.filter(r => r.order_id === order.id);
  return <section className="order-after-sales" aria-label="After-sales">{history.map(row => <RequestDetails key={row.id} row={row} />)}
    {order.eligible_request && !history.some(r => r.status !== 'REJECTED') && <form onSubmit={event => { event.preventDefault(); create.mutate(); }}>
      <label>Reason for {order.eligible_request}<textarea required maxLength={500} value={reason} onChange={event => setReason(event.target.value)} /></label>
      <button className="primary-button" disabled={!reason.trim() || create.isPending}>Request {order.eligible_request}</button>
    </form>}{create.isError && <p role="alert">{create.error.message}</p>}</section>;
}

export function AdminAfterSales() {
  const [kind, setKind] = useState('cancellation');
  const refresh = useRefresh();
  const queue = useQuery({ queryKey: ['admin-after-sales', kind], queryFn: () => getJson<QueueEntry[]>('/api/v1/admin/after-sales?kind=' + kind) });
  const decision = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => patchJson('/api/v1/admin/after-sales/' + id, { status }),
    onSettled: refresh,
  });
  return <section className="page-section after-sales-queue"><h1>After-sales</h1>
    <label>Request queue <select value={kind} onChange={event => setKind(event.target.value)}>
      <option value="cancellation">Cancellations</option><option value="return">Returns</option></select></label>
    {queue.isPending && <p>Loading requests…</p>}{queue.isError && <p role="alert">{queue.error.message}</p>}
    {decision.isError && <p role="alert">{decision.error.message}</p>}{decision.isSuccess && <p role="status">Request updated.</p>}
    {queue.data?.length === 0 && <p>No {kind} requests.</p>}
    {queue.data?.map(row => {
      const actions = row.status === 'REQUESTED' ? ['APPROVED', 'REJECTED'] :
        kind === 'return' && row.status === 'APPROVED' ? ['RECEIVED'] : row.status === 'RECEIVED' ? ['COMPLETED'] : [];
      const labels: Record<string,string> = { APPROVED: 'Approve', REJECTED: 'Reject', RECEIVED: 'Mark received', COMPLETED: 'Complete return' };
      return <article key={row.id} className="order-card"><h2>Order #{row.order_id}</h2>
        <p>Customer #{row.customer_id} · Payment {row.payment_status}</p><ul>{row.items.map((item,i) => <li key={i}>{item}</li>)}</ul>
        <RequestDetails row={row} /><dl>{Object.entries({ Requested: row.created_at, Decided: row.decided_at, Received: row.received_at, Completed: row.completed_at })
          .filter(([,time]) => time).map(([label,time]) => <div key={label}><dt>{label}</dt><dd>{new Date(time!).toLocaleString()}</dd></div>)}</dl>
        {actions.map(status => <button key={status} disabled={decision.isPending} onClick={() => decision.mutate({ id: row.id, status })}>{labels[status]}</button>)}
      </article>;
    })}</section>;
}

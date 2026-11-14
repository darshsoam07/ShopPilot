import { getJson } from '../../services/http';
import type { OrderList } from './types';
export function getOrders(): Promise<OrderList> { return getJson<OrderList>('/api/v1/orders'); }

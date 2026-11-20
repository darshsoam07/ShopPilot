import { getJson, postJson } from '../../services/http';
import type { OrderList, Order, CheckoutPayload, CouponValidationResult } from './types';
export function getOrders(): Promise<OrderList> { return getJson<OrderList>('/api/v1/orders'); }
export function validateCouponCode(code: string, subtotal: string) {
  return postJson<CouponValidationResult>('/api/v1/orders/validate-coupon', { code, subtotal });
}
export function submitCheckoutOrder(payload: CheckoutPayload) {
  return postJson<Order>('/api/v1/orders/checkout', payload);
}

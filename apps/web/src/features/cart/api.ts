import { deleteJson, getJson, patchJson, postJson } from '../../services/http';
import type { Cart } from './types';

export function getCart(): Promise<Cart> {
  return getJson<Cart>('/api/v1/cart');
}

export function addCartItem(productId: number, quantity = 1): Promise<Cart> {
  return postJson<Cart>('/api/v1/cart/items', { product_id: productId, quantity });
}

export function updateCartItem(itemId: number, quantity: number): Promise<Cart> {
  return patchJson<Cart>(`/api/v1/cart/items/${itemId}`, { quantity });
}

export function removeCartItem(itemId: number): Promise<{ message: string }> {
  return deleteJson<{ message: string }>(`/api/v1/cart/items/${itemId}`);
}

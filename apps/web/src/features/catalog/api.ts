import { getJson } from '../../services/http';
import type { ProductListResponse } from './types';

export function getProducts(): Promise<ProductListResponse> {
  return getJson<ProductListResponse>('/api/v1/products?limit=12&offset=0');
}

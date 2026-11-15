import { getJson } from '../../services/http';
import type { ProductListResponse } from './types';

export function getProducts(params = 'limit=12&offset=0'): Promise<ProductListResponse> {
  return getJson<ProductListResponse>('/api/v1/products?' + params);
}

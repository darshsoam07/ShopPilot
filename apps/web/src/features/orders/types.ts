export interface Order {
  id: number;
  status: string;
  total_amount: string;
  currency: string;
  shipping_address: Record<string, string | null>;
  created_at: string;
  items: Array<{ id: number; product_id: number | null; product_name: string; sku: string; unit_price: string; quantity: number; line_total: string }>;
}
export interface OrderList { items: Order[]; total: number }

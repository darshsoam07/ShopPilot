export interface Order {
  id: number;
  status: string;
  shipping_cost: string;
  subtotal_amount: string | null;
  discount_amount: string;
  coupon_code: string | null;
  payment_method: string;
  receipt_number: string | null;
  total_amount: string;
  currency: string;
  shipping_address: Record<string, string | null>;
  created_at: string;
  items: Array<{ id: number; product_id: number | null; product_name: string; sku: string; unit_price: string; quantity: number; line_total: string }>;
}
export interface OrderList { items: Order[]; total: number }
export interface CheckoutPayload {
  carrier?: "DHL" | "FedEx" | "GLS";
  simulate_failure?: boolean;
  shipping: { country?: string; phone?: string; billing_address?: string;
    full_name: string;
    address: string;
    city: string;
    postal_code: string;
  };
  payment_method: "card" | "upi" | "cod";
  coupon_code?: string;
}

export interface CouponValidationResult {
  valid: boolean;
  code: string;
  discount_percent: string;
  discount_amount: string;
  final_total: string;
  message: string;
}

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    specifications?: Record<string,string>;
    sku: string;
    price: string;
    image_url: string | null;
    stock_quantity: number;
  };
}

export interface Cart {
  id: number;
  items: CartItem[];
  item_count: number;
  subtotal: string;
  updated_at: string;
}


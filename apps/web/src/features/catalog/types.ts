export interface Product {
  id: number;
  name: string;
  category: string;
  brand: string | null;
  gallery_images: string[];
  specifications: Record<string, string>;
  rating: string | null;
  review_count: number;
  slug: string;
  description: string;
  sku: string;
  price: string;
  stock_quantity: number;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  limit: number;
  offset: number;
}

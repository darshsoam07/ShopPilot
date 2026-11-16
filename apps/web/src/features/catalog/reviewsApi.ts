import { getJson, postJson } from "../../services/http";

export interface ReviewItem {
  id: number;
  product_id: number;
  user_id: number;
  author_name: string;
  rating: number;
  title: string;
  comment: string;
  is_verified_purchase: boolean;
  created_at: string;
}

export interface AISentimentDigest {
  average_rating: number;
  total_reviews: number;
  verified_count: number;
  sentiment_label: string;
  summary: string;
  pros: string[];
  cons: string[];
}

export interface ProductReviewsBundle {
  digest: AISentimentDigest;
  reviews: ReviewItem[];
  can_review: boolean;
}

export async function fetchProductReviews(
  productId: number
): Promise<ProductReviewsBundle> {
  return getJson<ProductReviewsBundle>(
    `/api/v1/products/${productId}/reviews`
  );

}

export async function submitProductReview(
  productId: number,
  payload: { rating: number; title: string; comment: string }
): Promise<ReviewItem> {
  return postJson<ReviewItem>(
    `/api/v1/products/${productId}/reviews`,
    payload
  );

}

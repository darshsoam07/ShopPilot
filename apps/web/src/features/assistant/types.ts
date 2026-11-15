import { Product } from "../catalog/types";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  recommended_products?: Product[];
  action?: {
    tool_name: string;
    status: "executed" | "requires_auth" | "failed" | "skipped";
    summary: string;
    payload?: Record<string, unknown>;
  };
}

export interface AssistantQueryPayload {
  message: string;
  history: { role: "user" | "assistant"; content: string }[];
  context?: {
    active_product_id?: number;
    active_category?: string;
    max_budget?: number;
  };
}

export interface AssistantQueryResponse {
  reply: string;
  recommended_products: Product[];
  action?: ChatMessage["action"];
  follow_up_prompts: string[];
}

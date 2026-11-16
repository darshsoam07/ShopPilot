import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { sendAssistantMessage } from "../../features/assistant/api";
import { useAuth } from "../../context/AuthContext";
import { getJson } from "../../services/http";
import { ChatMessage } from "../../features/assistant/types";

interface AssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCartUpdated?: () => void;
}

export const AssistantDrawer: React.FC<AssistantDrawerProps> = ({
  isOpen,
  onClose,
  onCartUpdated,
}) => {
  const { isAuthenticated } = useAuth();
  const [restoring, setRestoring] = useState(isAuthenticated);
  const location = useLocation();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm ShopPilot. Ask me to find products under a budget, compare specs, or add items straight to your cart.",
    },
  ]);
  const [prompts, setPrompts] = useState<string[]>([
    "Show me top products under ₹10,000",
    "What items are in stock right now?",
  ]);

  // Detect if user is currently viewing /products/:productId
  const productMatch = location.pathname.match(/^\/products\/(\d+)/);
  const activeProductId = productMatch ? Number(productMatch[1]) : undefined;

  useEffect(() => {
    if (!isAuthenticated) return;
    let current = true;
    getJson<ChatMessage[]>('/api/v1/assistant/history').then(rows => {
      if (current && rows.length) setMessages(rows);
    }).catch(() => {}).finally(() => { if (current) setRestoring(false); });
    return () => { current = false; };
  }, [isAuthenticated]);

  const handleSend = async (textOverride?: string) => {
    const query = (textOverride ?? input).trim();
    if (!query || restoring || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: query };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await sendAssistantMessage({
        message: query,
        history: messages.slice(-12).map((m) => ({ role: m.role, content: m.content })),
        context: { active_product_id: activeProductId },
      });

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.reply,
          recommended_products: res.recommended_products,
          action: res.action,
        },
      ]);

      if (res.follow_up_prompts?.length) {
        setPrompts(res.follow_up_prompts);
      }

      if (res.action?.tool_name === "add_to_cart" && res.action.status === "executed") {
        onCartUpdated?.();
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I ran into a connection error reaching the ShopPilot API. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        backgroundColor: "rgba(16, 24, 40, 0.35)",
        backdropFilter: "blur(2px)",
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <aside role="dialog" aria-modal="true" aria-label="ShopPilot assistant"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(440px, 100vw)",
          height: "100%",
          backgroundColor: "var(--bg-ai-panel, #F2F0EC)",
          color: "var(--text-primary, #141413)",
          borderLeft: "1px solid var(--border-hairline, #E5E3DD)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-12px 0 32px rgba(0, 0, 0, 0.08)",
        }}
      >
        {/* Header */}
        <header
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border-hairline, #E5E3DD)",
            backgroundColor: "var(--bg-elevated, #FFFFFF)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: "var(--accent-ai, #E85D34)",
                }}
              />
              <strong style={{ fontSize: "15px" }}>ShopPilot AI Copilot</strong>
            </div>
            {activeProductId && (
              <span
                style={{
                  fontSize: "12px",
                  color: "var(--text-secondary, #6E6D68)",
                  display: "block",
                  marginTop: "2px",
                }}
              >
                Context active: Product #{activeProductId}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid var(--border-hairline, #E5E3DD)",
              borderRadius: "6px",
              padding: "4px 10px",
              cursor: "pointer",
              color: "var(--text-primary, #141413)",
            }}
          >
            Esc
          </button>
        </header>

        {/* Message Stream */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
          }}
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "88%",
              }}
            >
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  lineHeight: 1.5,
                  backgroundColor:
                    msg.role === "user"
                      ? "var(--cta-bg, #141413)"
                      : "var(--bg-elevated, #FFFFFF)",
                  color:
                    msg.role === "user"
                      ? "var(--cta-text, #F9F8F6)"
                      : "var(--text-primary, #141413)",
                  border:
                    msg.role === "assistant"
                      ? "1px solid var(--border-hairline, #E5E3DD)"
                      : "none",
                }}
              >
                {msg.content}
              </div>

              {/* Agent Tool Execution Badge */}
              {msg.action && msg.action.tool_name !== "none" && (
                <div
                  style={{
                    marginTop: "6px",
                    fontSize: "11px",
                    color: "var(--text-secondary, #6E6D68)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span style={{ color: "var(--accent-ai, #E85D34)", fontWeight: 600 }}>
                    ⚡ {msg.action.tool_name}
                  </span>
                  <span>• {msg.action.summary}</span>
                </div>
              )}

              {/* Recommended Product Mini-Cards */}
              {msg.action?.tool_name === "compare_products" && !!msg.recommended_products?.length && <div style={{overflowX:'auto'}}><table><thead><tr>{['SKU','Finish','Bundle','Protection','Price','Stock'].map(k => <th key={k}>{k}</th>)}</tr></thead><tbody>
                {msg.recommended_products.map(p => <tr key={p.id}><td>{p.sku}</td><td>{p.specifications?.Finish}</td><td>{p.specifications?.Configuration}</td><td>{p.specifications?.Protection}</td><td>₹{p.price}</td><td>{p.stock_quantity}</td></tr>)}
              </tbody></table></div>}
              {msg.recommended_products && msg.recommended_products.length > 0 && (
                <div
                  style={{
                    marginTop: "10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {msg.recommended_products.map((prod) => (
                    <Link
                      key={prod.id}
                      to={`/products/${prod.id}`}
                      onClick={onClose}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        backgroundColor: "var(--bg-elevated, #FFFFFF)",
                        border: "1px solid var(--border-hairline, #E5E3DD)",
                        textDecoration: "none",
                        color: "var(--text-primary, #141413)",
                        fontSize: "13px",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{prod.name}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary, #6E6D68)" }}>
                          {prod.stock_quantity > 0 ? `${prod.stock_quantity} in stock` : "Out of stock"}
                        </div>
                      </div>
                      <strong style={{ color: "var(--accent-ai, #E85D34)" }}>
                        ₹{Number(prod.price).toFixed(2)}
                      </strong>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Suggested Follow-up Chips */}
        <div
          style={{
            padding: "8px 20px",
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            borderTop: "1px solid var(--border-hairline, #E5E3DD)",
          }}
        >
          {prompts.map((chip, i) => (
            <button
              key={i}
              onClick={() => handleSend(chip)}
              style={{
                fontSize: "12px",
                padding: "5px 10px",
                borderRadius: "999px",
                border: "1px solid var(--border-hairline, #E5E3DD)",
                backgroundColor: "var(--bg-elevated, #FFFFFF)",
                color: "var(--text-primary, #141413)",
                cursor: "pointer",
              }}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          style={{
            padding: "14px 20px",
            backgroundColor: "var(--bg-elevated, #FFFFFF)",
            borderTop: "1px solid var(--border-hairline, #E5E3DD)",
            display: "flex",
            gap: "8px",
          }}
        >
          <input
            autoFocus aria-label="Message ShopPilot" maxLength={1000} type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              activeProductId
                ? "Ask about this product or say 'Add to cart'..."
                : "Search by budget, use case, or specs..."
            }
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid var(--border-hairline, #E5E3DD)",
              fontSize: "14px",
            }}
          />
          <button
            type="submit"
            disabled={isLoading || restoring}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "var(--cta-bg, #141413)",
              color: "var(--cta-text, #F9F8F6)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isLoading ? "..." : "Ask"}
          </button>
        </form>
      </aside>
    </div>
  );
};

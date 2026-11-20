// apps/web/src/components/layout/CommandPalette.tsx
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Search, Sparkles, CornerDownLeft, X } from "lucide-react";
import { STAGGER_LIST, STAGGER_ITEM } from "../../lib/motion";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { sendAssistantMessage } from "../../features/assistant/api";
import type { ChatMessage } from "../../features/assistant/types";
import { getJson } from "../../services/http";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_PROMPTS = [
  "Compare wireless headphones under ₹15,000",
  "Show minimalist desk accessories in stock",
  "What is the best gift for a developer?",
];

export function CommandPalette({
  isOpen,
  onClose,
}: CommandPaletteProps) {
  const { user } = useAuth();
  const location = useLocation();
  const cache = useQueryClient();
  const history = useQuery({
    queryKey: ["assistant-history", user?.id],
    enabled: !!user && isOpen,
    queryFn: () => getJson<ChatMessage[]>("/api/v1/assistant/history"),
  });
  const [session, setSession] = useState<ChatMessage[] | null>(null);
  const messages = session ?? history.data ?? [];
  const [prompts, setPrompts] = useState(QUICK_PROMPTS);
  const mutation = useMutation({
    mutationFn: (prompt: string) => sendAssistantMessage({
      message: prompt,
      history: messages.slice(-12).map(({ role, content }) => ({ role, content })),
      context: { active_product_id: Number(location.pathname.match(/^\/products\/(\d+)$/)?.[1]) || undefined },
    }),
    onSuccess: (reply, prompt) => {
      const next: ChatMessage[] = [...messages, { role: "user", content: prompt },
        { role: "assistant", content: reply.reply, action: reply.action, recommended_products: reply.recommended_products }];
      setSession(next);
      if (user) cache.setQueryData(["assistant-history", user.id], next);
      if (reply.follow_up_prompts.length) setPrompts(reply.follow_up_prompts);
      if (reply.action?.tool_name === "add_to_cart" && reply.action.status === "executed") {
        void cache.invalidateQueries({ queryKey: ["cart"] });
      }
    },
    onError: (_error, prompt) => setQuery(prompt),
  });
  const isLoading = mutation.isPending || (!!user && history.isLoading);
  const onSendMessage = (prompt: string) => {
    if (!isLoading && prompt.trim()) mutation.mutate(prompt.trim());
  };
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const previous = document.activeElement;
      inputRef.current?.focus();
      return () => { if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
    }
  }, [isOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || isLoading) return;
    setQuery("");
    await onSendMessage(trimmed);
  };

  return (
    <div className="palette-overlay" onClick={onClose} role="presentation">
      <div
        className="palette-dialog"
        onKeyDown={event => {
          if (event.key !== 'Tab') return;
          const controls = event.currentTarget.querySelectorAll<HTMLElement>('input, button:not(:disabled), a[href]');
          const first = controls[0], last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }}
        role="dialog"
        aria-modal="true"
        aria-label="ShopPilot AI Assistant"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="palette-input-row">
          <Search size={18} className="palette-icon" />
          <input
            aria-label="Ask ShopPilot" maxLength={2000}
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask ShopPilot AI to find products, compare SKUs, or check stock..."
            className="palette-input"
          />
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="palette-submit"
            aria-label="Send query"
          >
            <CornerDownLeft size={14} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="icon-btn"
            aria-label="Close command palette"
          >
            <X size={16} />
          </button>
        </form>

        <div className="palette-body" data-lenis-prevent aria-live="polite">
          {history.isError && !session && <p role="alert">Conversation history could not be loaded. <button onClick={() => history.refetch()}>Retry</button></p>}
          {mutation.isError && <p role="alert">{mutation.error.message}</p>}
          {isLoading && <p role="status">{mutation.isPending ? "Searching catalog…" : "Loading conversation…"}</p>}
          {messages.length === 0 ? (
            <motion.div
              variants={STAGGER_LIST}
              initial="hidden"
              animate="visible"
              className="palette-suggestions"
            >
              <span className="palette-section-label">
                <Sparkles size={13} /> Suggested Queries
              </span>
              {prompts.map((prompt) => (
                <motion.button
                  key={prompt}
                  type="button"
                  variants={STAGGER_ITEM}
                  disabled={isLoading} onClick={() => onSendMessage(prompt)}
                  className="palette-suggestion-btn"
                >
                  {prompt}
                </motion.button>
              ))}
            </motion.div>
          ) : (
            <motion.ul
              variants={STAGGER_LIST}
              initial="hidden"
              animate="visible"
              className="palette-messages"
            >
              {messages.map((msg, index) => (
                <motion.li
                  key={index}
                  initial={msg.role === "assistant" ? "hidden" : false} animate="visible" variants={msg.role === "assistant" ? STAGGER_ITEM : undefined}
                  className={`palette-msg palette-msg--${msg.role}`}
                >
                  <span className="palette-msg__role font-mono-tabular">
                    {msg.role === "user" ? "YOU" : "SHOPPILOT AI"}
                  </span>
                  <p className="palette-msg__text">{msg.content}</p>
                  {msg.recommended_products?.map(product => <p key={product.id}><Link to={'/products/' + product.id} onClick={onClose}>{product.name} · {product.sku} · ₹{product.price}</Link></p>)}
                  {msg.action && <small>{msg.action.summary}</small>}
                </motion.li>
              ))}
            </motion.ul>
          )}
        </div>

        {messages.length > 0 && <div className="palette-followups">{prompts.map(prompt =>
          <button key={prompt} disabled={isLoading} onClick={() => onSendMessage(prompt)}>{prompt}</button>)}</div>}
        <footer className="palette-footer font-mono-tabular">
          <span>ESC to close</span>
          <span>ENTER to ask</span>
        </footer>
      </div>
    </div>
  );
}


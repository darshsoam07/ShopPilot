import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CornerDownLeft, Info, Search, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sendAssistantMessage } from '../../features/assistant/api';
import { AssistantProductRow } from '../../features/assistant/AssistantProductRow';
import type { ChatMessage } from '../../features/assistant/types';
import { getProducts } from '../../features/catalog/api';
import { dedupeById } from '../../features/catalog/dedupe';
import { useDebounce } from '../../hooks/useDebounce';
import { getJson } from '../../services/http';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_PROMPTS = [
  'Compare wireless headphones under ₹15,000',
  'Show minimalist desk accessories in stock',
  'What is the best gift for a developer?',
];

const FOCUSABLE = 'input, button:not(:disabled), a[href]';

/**
 * Opened from the keyboard, so it has no open or close animation by design.
 * Arrow keys move through results; Enter asks the assistant; Escape closes.
 */
export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const { user } = useAuth();
  const location = useLocation();
  const cache = useQueryClient();
  const dialog = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [session, setSession] = useState<ChatMessage[] | null>(null);
  const [prompts, setPrompts] = useState(QUICK_PROMPTS);

  const history = useQuery({
    queryKey: ['assistant-history', user?.id],
    enabled: !!user && isOpen,
    queryFn: () => getJson<ChatMessage[]>('/api/v1/assistant/history'),
  });
  const messages = session ?? history.data ?? [];

  const term = useDebounce(query.trim(), 180);
  const live = useQuery({
    queryKey: ['palette-search', term],
    enabled: isOpen && term.length >= 2,
    queryFn: () => getProducts('limit=4&offset=0&q=' + encodeURIComponent(term)),
    placeholderData: keepPreviousData,
  });
  const liveItems = term.length >= 2 ? dedupeById(live.data?.items ?? []) : [];

  const mutation = useMutation({
    mutationFn: (prompt: string) => sendAssistantMessage({
      message: prompt,
      history: messages.slice(-12).map(({ role, content }) => ({ role, content })),
      context: { active_product_id: Number(location.pathname.match(/^\/products\/(\d+)$/)?.[1]) || undefined },
    }),
    onSuccess: (reply, prompt) => {
      const next: ChatMessage[] = [...messages, { role: 'user', content: prompt },
        { role: 'assistant', content: reply.reply, action: reply.action, recommended_products: reply.recommended_products }];
      setSession(next);
      if (user) cache.setQueryData(['assistant-history', user.id], next);
      if (reply.follow_up_prompts.length) setPrompts(reply.follow_up_prompts);
      if (reply.action?.tool_name === 'add_to_cart' && reply.action.status === 'executed') {
        void cache.invalidateQueries({ queryKey: ['cart'] });
      }
    },
    onError: (_error, prompt) => setQuery(prompt),
  });
  const isLoading = mutation.isPending || (!!user && history.isLoading);
  const ask = (prompt: string) => { if (!isLoading && prompt.trim()) mutation.mutate(prompt.trim()); };

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement;
    inputRef.current?.focus();
    return () => { if (previous instanceof HTMLElement && previous.isConnected) previous.focus(); };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || isLoading) return;
    setQuery('');
    ask(trimmed);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const root = event.currentTarget;
    if (event.key === 'Tab') {
      const controls = root.querySelectorAll<HTMLElement>(FOCUSABLE);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      return;
    }
    const items = Array.from(root.querySelectorAll<HTMLElement>('[data-palette-item]'));
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      items[Math.min(items.length - 1, index + 1)]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (index <= 0) inputRef.current?.focus(); else items[index - 1].focus();
    } else if (index >= 0 && event.key.length === 1 && event.key !== ' ' && !event.ctrlKey && !event.metaKey) {
      inputRef.current?.focus(); // typing from a result goes back to the field
    }
  };

  const showSuggestions = messages.length === 0 && liveItems.length === 0 && !mutation.isPending;

  return (
    <div className="palette-overlay" onClick={onClose} role="presentation">
      <div ref={dialog} className="palette-dialog" role="dialog" aria-modal="true" aria-label="ShopPilot assistant"
        onClick={event => event.stopPropagation()} onKeyDown={onKeyDown}>
        <form onSubmit={submit} className="palette-input-row">
          <Search size={18} className="palette-icon" aria-hidden="true" />
          <input ref={inputRef} type="text" className="palette-input" aria-label="Ask ShopPilot" maxLength={2000}
            value={query} onChange={event => setQuery(event.target.value)}
            placeholder="Search products or ask a question" autoComplete="off" />
          <button type="submit" className="palette-submit" disabled={!query.trim() || isLoading} aria-label="Send query"><CornerDownLeft size={14} aria-hidden="true" /></button>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close assistant"><X size={16} aria-hidden="true" /></button>
        </form>

        <div className="palette-body" data-lenis-prevent aria-live="polite">
          {history.isError && !session && <p className="palette-note" role="alert">Conversation history couldn’t be loaded. <button type="button" onClick={() => history.refetch()}>Retry</button></p>}
          {mutation.isError && <p className="palette-note" role="alert">{mutation.error.message}</p>}
          {isLoading && (
            <div role="status" aria-label={mutation.isPending ? 'Searching the catalogue' : 'Loading the conversation'} className="palette-loading">
              <div className="skeleton palette-loading__row" /><div className="skeleton palette-loading__row" />
            </div>
          )}

          {liveItems.length > 0 && (
            <section aria-label="Matching products">
              <h2 className="palette-section">Products</h2>
              {liveItems.map(product => <AssistantProductRow key={product.id} product={product} onNavigate={onClose} />)}
              <Link className="palette-all" data-palette-item to={'/products?q=' + encodeURIComponent(term)} onClick={onClose}>See all results for “{term}”</Link>
            </section>
          )}

          {showSuggestions && (
            <section aria-label="Suggestions">
              <h2 className="palette-section">Try asking</h2>
              {prompts.map(prompt => (
                <button key={prompt} type="button" className="palette-suggestion" data-palette-item disabled={isLoading} onClick={() => ask(prompt)}>
                  <span>{prompt}</span><CornerDownLeft size={13} aria-hidden="true" />
                </button>
              ))}
            </section>
          )}

          {messages.length > 0 && (
            <ul className="palette-messages">
              {messages.map((message, index) => (
                <li key={index} className={`palette-msg palette-msg--${message.role}`}>
                  <span className="palette-msg__role">{message.role === 'user' ? 'You' : 'Assistant'}</span>
                  <p className="palette-msg__text">{message.content}</p>
                  {message.action && (
                    <p className="palette-action" data-status={message.action.status}>
                      {message.action.status === 'executed' ? <Check size={13} aria-hidden="true" /> : <Info size={13} aria-hidden="true" />}
                      {message.action.summary}
                    </p>
                  )}
                  {dedupeById(message.recommended_products ?? []).map(product => <AssistantProductRow key={product.id} product={product} onNavigate={onClose} />)}
                </li>
              ))}
            </ul>
          )}
        </div>

        {messages.length > 0 && (
          <div className="palette-followups">
            {prompts.map(prompt => <button key={prompt} type="button" data-palette-item disabled={isLoading} onClick={() => ask(prompt)}>{prompt}</button>)}
          </div>
        )}
        <footer className="palette-footer" aria-hidden="true">
          <span><kbd>↑</kbd><kbd>↓</kbd> Move</span>
          <span><kbd>↵</kbd> Ask</span>
          <span><kbd>Esc</kbd> Close</span>
        </footer>
      </div>
    </div>
  );
}

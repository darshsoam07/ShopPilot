# ShopPilot — agent rules

ShopPilot is a small, real-looking storefront: React + TS (`apps/web`),
FastAPI (`apps/api`), PostgreSQL, JWT auth, Stripe checkout.
It is a portfolio project judged by whether it looks and behaves like
something a person shipped, not like a generated demo.

If a rule here conflicts with your default instincts, the rule wins.

## Hard bans

- No purple/blue gradients. No glassmorphism. No `backdrop-blur` decoration.
- No ✨ / 🤖 / 🚀 emoji as UI. No emoji in headings.
- No marketing fiction: "10k+ happy customers", fake review counts,
  "Trusted by", invented logos, "Enterprise-grade", "production-ready".
- No arbitrary Tailwind values (`mt-[18px]`, `text-[13px]`, `w-[437px]`).
  Only scale tokens. If a value isn't on the scale, the design is wrong.
- No raw hex in components. Colors come from CSS vars only.
- No `text-gray-500` for body copy. Use `--ink-muted`.
- No shadows on cards. Use the 1px hairline border. Shadows only for
  overlays (dropdown, dialog, toast) via `shadow-pop`.
- No new dependency for something under ~80 lines.
- No architecture for its own sake: no repository factory, no hexagonal
  folders, no DTO layer duplicating Pydantic schemas, no Celery.
- No comments explaining *what* code does. Only *why*, and only when
  non-obvious.

## Typography — non-negotiable

Three families, strict roles:

| Role | Family | Where |
|---|---|---|
| Display | Fraunces (`--font-display`) | Page titles, section headings, product title on PDP, hero. **Nowhere else.** |
| UI | Instrument Sans (`--font-sans`) | Everything else: body, nav, buttons, labels, forms, tables, prices. |
| Mono | Geist Mono (`--font-mono`) | Order IDs, SKUs, tracking numbers, code. Never prices. |

Rules:
- Sizes come from `--text-*` only. Use the `text-*` Tailwind classes,
  never raw `text-[15px]`.
- Display sizes get negative tracking (already in tokens). Never add
  positive tracking to display type.
- Buttons, nav links, labels, form fields: `text-sm font-medium`, tracking
  `0.005em`. Never display font.
- Eyebrow labels (max 1 per section): `text-2xs uppercase tracking-[0.08em]
  text-ink-muted`. Never more than one eyebrow per view.
- All prices, totals, quantities, table numerics: `tabular-nums`.
- Body copy max-width `62ch`. Never full-bleed paragraphs.
- Max 2 weights per view: 400 and 500. Display font may use 400 + 600 only.
- Sentence case everywhere. No Title Case In Buttons. No exclamation marks.

## Layout & spacing

- Spacing from `--space-*` only (4px base).
- Page gutter: 16px mobile, 24px tablet, 32px desktop, max content 1200px.
- One consistent section rhythm: 64px mobile / 96px desktop between
  major sections.
- Product grid: fixed `aspect-[4/5]` image, `line-clamp-2` title,
  fixed-height price row, `gap-4` mobile / `gap-6` desktop.
  Cards must not jump when a title wraps.

## Color

- Base: `--paper` (#FAF8F5) surfaces, `--ink` (#14110F) text.
- One accent: `--accent` (#1F5D46). Accent only on: primary button,
  active nav state, focus ring, one link style. Never as a background
  fill for large areas.
- Lines/borders: `--line` (#E6E1D8). Cards, tables, dividers all use it.
- Muted text: `--ink-muted`. Never lighter than that (5.4:1 on paper).
- No color conveys state alone — pair with text or icon.

## Images

- One ratio everywhere: `4/5`. `object-cover`, fixed container.
- Every `<img>` has explicit `width`/`height`, `alt`, `decoding="async"`.
- `loading="lazy"` except the single LCP image (hero / first product),
  which gets `loading="eager" fetchpriority="high"`.
- Uploads under 1000px on the short side are rejected server-side.
- Derivatives at 400/800/1600w, WebP + AVIF, content-hashed filenames,
  `Cache-Control: immutable`.
- Placeholder is a blurhash, not a spinner.
- Budget: LCP image < 200KB, listing image < 80KB.

## Every list/table view has four states

`loading` (skeleton matching final layout, not a spinner), `empty`
(one sentence + a way out), `error` (retry button), `data`.
Same for cart, orders, admin tables, search results.

## Accessibility floor

- Visible focus ring on everything interactive: 2px `--accent` offset 2px.
- Tabbing through category nav → product grid → add-to-cart is sane.
- Test at 320px width.
- Touch targets ≥ 40px.
- One `h1` per page, headings in order.

## Copy

- Real product names, real descriptions, real prices. 8–12 seeded products
  beats 50 placeholder ones.
- Empty state: "No products match these filters." + "Clear filters" button.
- Errors state what happened and what to do. No "Oops!".
- Button labels are verbs: "Add to cart", "Place order", "Save changes".

## Code shape

- `routers/` (HTTP only) → `services/` (logic) → `models/` (SQLAlchemy).
  Pydantic schemas are the DTOs. Nothing else.
- Any order status change goes through one `transition_order_status()`
  function with an explicit allowed-transitions map.
- Never trust a client-supplied total. Recompute at payment-intent creation.
- Tests assert response body + DB state. `assert r.status_code == 200`
  alone is not a test.

## AI feature rule

An "AI" feature ships only if it performs an action (search, filter,
add to cart) against real data. If it only returns text, delete it and
ship the deterministic version under an honest name ("Related products").
Never label a query "AI recommendations".

## Definition of done

- [ ] No arbitrary Tailwind values in the diff
- [ ] All four view states implemented
- [ ] Keyboard-navigable, focus visible
- [ ] 320px and 1440px checked
- [ ] Images sized + lazy/priority correct
- [ ] Prices use tabular-nums
- [ ] No new copy that claims fake metrics
- [ ] Lighthouse on the changed page: LCP < 2.5s, CLS < 0.05

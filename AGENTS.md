# ShopPilot: agent rules

ShopPilot is a small, real-looking storefront: React + TS (`apps/web`),
FastAPI (`apps/api`), PostgreSQL, JWT auth, Stripe checkout.
It is a portfolio project judged by whether it looks and behaves like
something a person shipped, not like a generated demo.

`docs/design-system.md` is the single source of truth for tokens, type, color
and motion. This file is the rulebook. If they ever disagree, fix the doc, then
the code. If a rule here conflicts with your default instincts, the rule wins.

## Hard bans

- No purple/blue gradients. No glassmorphism. No `backdrop-filter`, ever.
  Overlays sit on a flat `--scrim`.
- No ✨ / 🤖 / 🚀 emoji as UI, and no sparkle icon standing in for them
  (lucide `Sparkles` included). No emoji in headings.
- No marketing fiction: "10k+ happy customers", fake review counts,
  "Trusted by", invented logos, invented editions or issue numbers,
  "Enterprise-grade", "production-ready".
- No arbitrary Tailwind values (`mt-[18px]`, `text-[13px]`, `w-[437px]`).
  Only scale tokens. If a value isn't on the scale, the design is wrong.
- No raw hex, rgb() or px font sizes in components. Colors and sizes come from
  CSS vars only.
- No `text-gray-500` for body copy. Use `--ink-muted`.
- No shadows on cards. Use the 1px hairline border. Shadows only for
  overlays (dropdown, dialog, toast) via `shadow-pop`.
- No new dependency for something under ~80 lines.
- No architecture for its own sake: no repository factory, no hexagonal
  folders, no DTO layer duplicating Pydantic schemas, no Celery.
- No comments explaining *what* code does. Only *why*, and only when
  non-obvious.
- No decorative text: ghost words, "//" labels, section numbers.

## Typography: non-negotiable

Three families, strict roles:

| Role | Family | Where |
|---|---|---|
| Display | Instrument Serif (`--font-display`) | Page titles, section headings, product title on PDP, hero. **Nowhere else.** |
| UI | Instrument Sans (`--font-sans`) | Everything else: body, nav, buttons, labels, forms, tables, prices. |
| Mono | Geist Mono (`--font-mono`) | Order IDs, SKUs, tracking numbers, code. Never prices. |

Rules:
- Sizes come from `--text-*` only. Use the `text-*` Tailwind classes or the
  vars, never raw `text-[15px]` or `font-size: 15px`.
- `--text-xl` to `--text-4xl` are fluid. Do not add breakpoints to resize type.
- Display sizes get negative tracking (already in tokens). Never add
  positive tracking to display type. Instrument Serif has one weight (400);
  never fake a bold.
- Buttons, nav links, labels, form fields: `text-sm font-medium`. Never display font.
- Eyebrow labels (max 1 per view): `.eyebrow`. Never more than one per view.
- All prices, totals, quantities, table numerics: `tabular-nums`.
- Body copy max-width `62ch`. Never full-bleed paragraphs.
- Two weights per view: 400 and 500.
- Sentence case everywhere. No Title Case In Buttons or headings. No exclamation marks.

## Layout & spacing

- Spacing from `--space-*` only (4px base).
- Page gutter `--gutter`: 16px mobile, 24px tablet, 32px desktop. Max content `--container-max` (1200px).
- Section rhythm `--section-space`: 64px mobile, 96px desktop between major sections.
- Product grid: fixed `aspect-[4/5]` image, `line-clamp-2` title,
  fixed-height price row, `gap-4` mobile / `gap-6` desktop.
  Cards must not jump when a title wraps.
- Header is `--nav-height` (72px) and compresses to `--nav-height-compact` (56px) on scroll. It is solid.

## Color

- Base: `--paper` (#F3F0E8) page, `--surface` (#FAF8F3) cards and overlays,
  `--paper-sunk` (#EAE6DA) inputs and image wells, `--ink` (#1B1A17) text.
- Primary buttons are ink on paper. Accent is not a button color.
- One accent, oxide: `--accent` (#B33D1D). Only for: active nav state, focus ring,
  links, small status marks. Never a fill for large areas. Never body text.
- One dark band per page at most (`.band`); adjacent sections may share it (home hero + campaign). It flips the tokens inside it, so
  components inside never need dark-mode variants.
- Lines: `--line` for decoration, `--line-control` for control boundaries (3:1).
- Muted text: `--ink-muted` (6.0:1 on paper). Never lighter.
- Status colors (`--success`, `--danger`) appear only with text or an icon. No color conveys state alone.

## Motion

- Curves and durations come from `lib/motion.ts` or the `--ease-*` / `--dur-*` tokens. Never write a new cubic-bezier.
- UI interactions run 120 to 260ms. Drawers and sheets up to 380ms. Scroll reveals up to 450ms. Nothing is slower.
- Animate `transform` and `opacity`. `clip-path` is allowed for reveals. Never animate width, height, margin, padding, top or left.
- No `transition: all`. Name the properties.
- No `ease-in`. No `scale(0)`. Entrances start from `opacity: 0` and a small offset.
- Keyboard-initiated and high-frequency actions do not animate. The command palette opens and closes instantly.
- Hover motion is gated by `@media (hover: hover) and (pointer: fine)` in CSS or `useMotionPolicy().animateHover` in JS.
- Anything a user can trigger twice in a second uses transitions or springs, not keyframes.
- Reduced motion is handled in exactly two places: the final block of `styles/base.css` and
  `lib/motion.ts` (plus `MotionConfig reducedMotion="user"`). Components do not add their own `matchMedia` checks.
- Smooth wheel scrolling (Lenis) runs on `/` only. Catalog, PDP, checkout, account and admin scroll natively.
- Dialogs and drawers that scroll internally carry `role="dialog"` or `data-lenis-prevent`.
- Stagger gaps are 30 to 80ms, one stagger per container.

## CSS architecture

- Cascade layers, in order: `reset, tokens, foundation, legacy, ui, surfaces`. Utilities stay unlayered and win.
  Do not name a native layer `base`, `components` or `utilities` (Tailwind v3 intercepts them).
- `styles/index.css` is imported first in `main.tsx`. Feature-level CSS wraps its rules in a layer.
- `legacy.css` is a shrinking bridge. Do not add to it.
- Tailwind preflight is off. The reset lives in `styles/base.css`.
- Every `var(--x)` must be defined in `styles/tokens.css`. No component declares its own palette.

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

`loading` (skeleton matching final layout using `.skeleton`, not a spinner), `empty`
(one sentence + a way out), `error` (retry button), `data`.
Same for cart, orders, admin tables, search results.

## Accessibility floor

- Visible focus ring on everything interactive: 2px `--accent` offset 2px. Never `outline: none`.
- Tabbing through category nav, product grid, add to cart is sane.
- Test at 320px width.
- Touch targets >= 44px (`--control`).
- One `h1` per page, headings in order.

## Copy

- Real product names, real descriptions, real prices. 8 to 12 seeded products
  beats 50 placeholder ones.
- The basket is the **cart** everywhere: "Add to cart", "Added to cart", "Continue to checkout".
  Never "bag". Browser tests locate controls by these names.
- Empty state: "No products match these filters." + "Clear filters" button.
- Errors state what happened and what to do. No "Oops!".
- Button labels are verbs: "Add to cart", "Place order", "Save changes".

## AI feature rule

An "AI" feature ships only if it performs an action (search, filter,
add to cart) against real data. If it only returns text, delete it and
ship the deterministic version under an honest name ("Related products").
Never label a query "AI recommendations".
There are two assistant surfaces and no more: `CommandPalette` (fast, inline, opened with Cmd or Ctrl + K)
and `AssistantPage` (`/assistant`, the long form). There is no assistant drawer.

## Browser test hooks

These class names and roles are read by `apps/web/tests/*`. Rename them only together with the tests:
`.copilot-trigger`, `.product-card`, `.product-image-wrap`, `.gallery-stage`, `.gallery-thumbs button`,
`.sku-options` (and its links), `.pdp-purchase`, `.purchase-strip`, `.campaign`, `.campaign-art`,
`.cart-item`, `.cart-item-image`, `.cart-line-total`, `.detail-layout`, `.sku-options a`, `.pdp-purchase form button`,
`.pdp-purchase > small`, `.pdp-purchase > strong`, `.spec-tiles`, and the accessible names
"Add to cart", "Place order", "Review order", "Save address", "Continue to checkout",
"Delivery address", "Payment method", "Demo gateway result", "Quantity", "Qty".

## Shared building blocks

- Adding to cart: `useAddToCart(productId)`. Never re-implement the mutation.
- Product tiles: `ProductCard` inside `ProductGrid` (or `ProductGridSkeleton`). Compact rows: `AssistantProductRow`.
- The header wordmark is Instrument Sans, not the display face.

## Loading states

Skeletons never reuse a test-hook class name (`.gallery-stage`, `.pdp-purchase`, `.detail-layout`, `.product-image-wrap`).
A hook that exists during loading detaches mid-action and breaks the browser tests.

## Code shape

- `routers/` (HTTP only) -> `services/` (logic) -> `models/` (SQLAlchemy).
  Pydantic schemas are the DTOs. Nothing else.
- Any order status change goes through one `transition_order_status()`
  function with an explicit allowed-transitions map.
- Never trust a client-supplied total. Recompute at payment-intent creation.
- Tests assert response body + DB state. `assert r.status_code == 200`
  alone is not a test.

## Definition of done

- [ ] No arbitrary Tailwind values, raw hex or px font sizes in the diff
- [ ] All four view states implemented
- [ ] Keyboard-navigable, focus visible
- [ ] 320px and 1440px checked
- [ ] Images sized + lazy/priority correct
- [ ] Prices use tabular-nums
- [ ] No new copy that claims fake metrics
- [ ] Motion uses `lib/motion.ts` tokens, hover gated, reduced motion checked
- [ ] Browser tests in `apps/web/tests/` pass
- [ ] Lighthouse on the changed page: LCP < 2.5s, CLS < 0.05

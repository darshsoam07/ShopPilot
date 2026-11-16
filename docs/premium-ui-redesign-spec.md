# ShopPilot Premium UI/UX Redesign Specification

**Version:** 1.0  
**Product direction:** Editorial Alabaster & Obsidian  
**Product positioning:** Curated technology. Intelligent discovery.  
**Source baseline:** `ShopPilot-main.zip` supplied 16 November 2026, cross-checked against GitHub `main` after PR #1 was merged.  
**Audience:** Product owner, frontend engineers, Codex implementation agent, and reviewers.

---

## 1. Executive design intent

ShopPilot should feel like a thoughtfully curated technology and lifestyle store with an intelligent shopping concierge—not a generic SaaS landing page with a product grid attached.

The experience should communicate three ideas immediately:

1. **Curation:** The products are presented as considered choices, not an undifferentiated database listing.
2. **Confidence:** Product imagery, specifications, pricing, availability, and checkout information are clear and trustworthy.
3. **Intelligent discovery:** The assistant helps shoppers find and understand products using the real ShopPilot catalogue.

The premium quality must come from art direction, typography, product photography, layout rhythm, precise interaction states, and content hierarchy. Do not attempt to create a premium result by adding random gradients, glassmorphism, excessive rounded cards, or decorative animation.

### Brand line

**ShopPilot — Curated technology. Intelligent discovery.**

Suggested supporting line: *Better tools for the way you work, create, and live.*

Use this as a direction, not as mandatory final marketing copy. Keep copy concise and specific to the technology catalogue.

## 2. Repository baseline and source-of-truth rules

The current GitHub `main` and supplied `ShopPilot-main.zip` contain the merged Editorial Alabaster & Obsidian stylesheet and design-system documentation. The verified frontend routes in the archive are:

| Route | Verified page/component | Current capability |
|---|---|---|
| `/` | `HomePage.tsx` | Live product list via `GET /api/v1/products`; existing hero and product cards |
| `/assistant` | `AssistantPage.tsx` | Rule-based catalogue recommendations via `POST /api/v1/assistant/recommendations` |
| `/login` | `AuthPage.tsx` | Existing login flow through `AuthContext` |
| `/register` | `AuthPage.tsx` | Existing customer registration flow |
| `/cart` | `CartPage.tsx` | Authenticated cart, quantity/remove, demo checkout |
| `/orders` | `OrdersPage.tsx` | Authenticated order history |
| `/admin` | `AdminPage.tsx` | Admin-only product creation, inventory, deactivation and image upload |

The screen recording shows additional local UI that is **not present in the verified repository snapshot**:

- A `Collection` navigation destination and collection/filter screen.
- A theme selector labelled `Editorial Alabaster`.
- An `Ask ShopPilot` header action and floating launcher.
- A right-side AI Copilot drawer with prompt suggestions and rich results.
- Additional local category tiles and search/filter controls.

Treat those as **observed local-only or uncommitted UI** until the user confirms they are part of the desired working tree. Do not silently delete them, recreate them, or assume that they are already in GitHub `main`.

### Mandatory source reconciliation before implementation

At the start of each implementation session, Codex must:

1. Run `git status --short --branch` and `git log -5 --oneline`.
2. Confirm the checked-out branch and compare it with `origin/main`.
3. Inspect uncommitted changes before editing. Never use `git reset --hard`, `git clean -fd`, or overwrite user files.
4. Inspect the current `App.tsx`, route tree, `styles.css`, page components, package manifest, and all local-only components visible in the current checkout.
5. Preserve work that exists locally but not in `origin/main`; report the discrepancy and adapt the visual changes around it.
6. Do not infer a capability from the screen recording if it is not present in the current source/API.

**Canonical behavior:** The current backend and its existing API contracts remain authoritative. The visual layer must not fabricate products, prices, stock, orders, recommendation scores, or account state.

## 3. Experience principles

### 3.1 Editorial, not template-driven

Use asymmetric compositions, strong typographic scale, carefully cropped product/editorial photography, and generous but controlled whitespace. Give each section a clear purpose. Not every section should be a bordered card.

### 3.2 Product imagery leads

Technology products need accurate, consistent imagery. Use a consistent image stage and crop rules. Never show the same unrelated image for multiple products as a visual filler. An image failure must degrade gracefully to a deliberate placeholder, not a broken-image icon.

### 3.3 Commerce clarity over decoration

Price, availability, variant, delivery/checkout information, and primary purchase actions must remain obvious. Visual refinement must not reduce usability or make the user hunt for the next action.

### 3.4 AI is integrated, but honest

The current assistant is rule-based and catalogue-grounded; it is not an LLM agent. UI copy must accurately describe the current capability. Show real products returned by the API and explain why they match only when the API provides that explanation. Do not claim personalization, memory, natural-language reasoning, order actions, or LLM intelligence that is not implemented.

### 3.5 A consistent system across distinct contexts

Customer pages should feel editorial and welcoming. Admin pages can be more utilitarian and information-dense, but must share the same typography, color tokens, focus styles, controls, spacing scale, and component logic.

## 4. Visual design system

### 4.1 Core palette

| Token | Hex | Intended use |
|---|---|---|
| Warm Alabaster | `#F9F8F6` | Main page canvas |
| Pure White | `#FFFFFF` | Elevated surfaces, product cards, forms, drawers and dialogs |
| Soft Linen | `#F2F0EC` | Secondary sections, image stages, filters and assistant surfaces |
| Deep Obsidian | `#141413` | Main text, brand mark, primary actions |
| Warm Slate | `#6E6D68` | Secondary text, descriptions and metadata |
| International Vermilion | `#E85D34` | AI identity, active indicator, small emphasis, sale/status highlight |
| Hairline Border | `#E5E3DD` | Dividers, boundaries and control outlines |

Semantic support colors may be retained for success/error states, but they must be muted and subordinate to the core palette. Do not use vermilion as a general background or for long text blocks.

### 4.2 CSS tokens

Keep one source of truth in `apps/web/src/styles.css` unless the current repository has since adopted a token framework. Prefer semantic variables such as:

```css
:root {
  --color-canvas: #F9F8F6;
  --color-surface: #FFFFFF;
  --color-surface-soft: #F2F0EC;
  --color-ink: #141413;
  --color-muted: #6E6D68;
  --color-accent: #E85D34;
  --color-border: #E5E3DD;
}
```

If existing variables (`--canvas`, `--surface`, `--surface-soft`, `--ink`, `--muted`, `--accent`, `--border`) are already referenced across components, preserve compatibility or migrate all references atomically. Do not create duplicate token systems.

### 4.3 Typography

- **Instrument Serif:** large editorial display moments only (homepage campaign headline, selected section titles, possibly assistant headline).
- **Manrope:** brand wordmark, interface headings, product titles, strong UI labels.
- **DM Sans:** body copy, navigation, forms, controls, metadata and utility text.

Typography hierarchy:

| Level | Desktop guideline | Notes |
|---|---:|---|
| Hero display | `clamp(3.5rem, 6vw, 5.8rem)` | Tight line-height; limit to 2–3 lines |
| Page title | `clamp(2rem, 3.5vw, 3.2rem)` | Manrope or Instrument Serif depending on context |
| Section title | `1.65–2rem` | Strong but not oversized |
| Product title | `0.95–1.1rem` | Prioritize scannability |
| Body | `0.875–1rem` | 1.55–1.8 line-height |
| Metadata | `0.68–0.78rem` | Adequate contrast; avoid tiny uppercase copy |

Do not use low-contrast grey for essential information. Avoid excessive letter spacing on long uppercase labels.

### 4.4 Shape, spacing and elevation

- Use a consistent 4/8 spacing rhythm.
- Prefer 4–8px radii for buttons and small controls; 8–14px for cards and panels.
- Avoid making every element pill-shaped.
- Use thin borders and soft shadows only where surfaces need separation.
- Keep page content aligned to a shared max-width and gutter system.
- Use full-bleed imagery or linen section backgrounds to create variety instead of nesting cards inside cards.

### 4.5 Motion and interaction

- Use subtle 160–260ms transitions for hover, focus, active, menu and drawer states.
- Product image zoom should be restrained (around 1.02–1.05), never disorienting.
- Use motion to clarify hierarchy and state, not as continuous decoration.
- Respect `prefers-reduced-motion`.
- No autoplay video, cursor gimmicks, scroll hijacking, or heavy parallax in Phase 1.

## 5. Screen-by-screen redesign specification

The following describes the **target experience**. The Phase 1 scope is deliberately narrower and is defined in Section 8.

### 5.1 Global shell and navigation

**Goal:** Establish a distinctive, calm, premium brand frame that remains consistent throughout the application.

**Desktop layout**

- A compact, sticky or politely static header with the ShopPilot wordmark on the left, core navigation centered, and account/cart actions on the right.
- Suggested customer navigation: `Discover`, `Collection`, `AI Stylist`.
- Account actions: `Sign in` / `Create account` when logged out; `Orders`, cart count, account name and `Sign out` when logged in.
- Show `Admin` only for users whose authenticated role is `admin`.
- Use one clearly named AI entry point. A nav item and an optional floating launcher may coexist only if they open the same experience and do not duplicate competing CTAs.
- Do not show a nonfunctional theme selector. If themes are actually supported in the current local checkout, preserve the feature and restyle it as a compact, accessible menu; do not implement a fake selector in Phase 1.

**Mobile**

- Wordmark and cart/account action on the first row.
- A compact menu button with an accessible expanded state for navigation.
- Avoid squeezing desktop links into a second dense row if a proper mobile menu can be built within scope.
- Preserve keyboard navigation, visible focus, Escape-to-close, and body scroll behavior for overlays.

**States:** logged out, logged in customer, logged in admin, mobile menu open, cart count loading/error/empty.

**Acceptance:** route links remain correct; admin visibility remains role-driven; cart count still comes from the existing cart query; logout still clears private query state; no new auth logic is introduced.

### 5.2 Discover / homepage (`/`)

**Goal:** Make the first viewport memorable and immediately explain why ShopPilot is useful.

**Hero composition**

- Replace the CSS orbit/rotated-card illustration with an image-led campaign composition using real technology product photography or an intentional editorial still life.
- Two-column desktop layout: editorial copy left; large photographic composition right. A single large, intentionally cropped image is preferable to several generic floating UI chips.
- Headline direction: `Better tools.` / `Better everyday.` with the second phrase set in italic Instrument Serif. Avoid claims such as “AI-powered personalization” unless it is implemented.
- Supporting copy: one concise statement about discovering considered technology for work, creativity and everyday life.
- Primary CTA: `Explore the collection` (anchor or real collection route depending on current routing).
- Secondary CTA: `Ask the ShopPilot assistant` only if it opens an implemented assistant surface.
- Optional trust line should describe a verified feature, e.g. live catalogue information—not generic invented social proof.

**Below the fold**

1. **Category / editorial entry points:** 3–5 image-led category panels using actual categories or a clearly documented curated mapping. Do not show hard-coded category counts.
2. **Featured selection:** product cards backed by `GET /api/v1/products`; show a clear loading, empty and error state.
3. **AI discovery feature band:** introduce the current catalogue recommendation assistant honestly. Use a short example prompt and a single CTA.
4. **Editorial supporting section:** explain the product-selection philosophy or offer a practical buying-guide entry point. Do not invent reviews, delivery guarantees or brand partnerships.
5. **Footer:** brand line, relevant navigation and concise product/project information.

**Image direction**

- Warm neutral studio backgrounds, soft but directional shadows, editorial still-life compositions, product close-ups, and consistent color temperature.
- Prefer actual product images over decorative abstract artwork.
- If product images are sourced, use licensed assets or user-approved local assets. Do not scrape or hotlink unverified image URLs.

**Acceptance:** Homepage content is responsive, image failures have a designed fallback, live products and add-to-cart behavior still work, and hero CTAs navigate to real destinations.

### 5.3 Collection / product listing (observed in screen recording; not in verified `main` route tree)

**Goal:** Make browsing and comparison effortless while retaining the editorial brand.

**Target layout**

- Breadcrumb: `Home / Collection`.
- Editorial page title and concise supporting line.
- Optional category image strip (e.g. Studio Audio, Workstations, Smart Wearables, Desk Minimal, Ambient Lamps) only if each item maps to a real category or a controlled content configuration.
- Search and sort controls in a single aligned toolbar.
- Desktop: left filter rail, right product grid; mobile: filter drawer/sheet and a visible sort control.
- Filters may include category, availability and price only when supported by the backend/query layer. If not supported, implement only truthful client-side filters over the fetched page and label the limitation; do not imply full-catalogue filtering when pagination hides results.
- Product result count must come from the API response and reflect active filters correctly.

**Product grid**

- 3 or 4 columns on wide desktop based on available width; 2 columns on tablet/mobile where legibility allows; 1 column on narrow phones only if product cards become too cramped.
- Consistent 4:5 image stage with predictable object-fit behavior.
- Product name, category/type if known, current price, availability, and a concise action.
- Avoid duplicating the same product variant as unrelated cards when variant data is not modeled.

**States:** initial loading, filtered results, no matches, API error, out-of-stock, image missing, sort active, filter drawer open.

**Backend boundary:** The current public product API supports catalogue retrieval, text search and pagination according to the repository README. Category taxonomy, category filters, price filtering, brand facets and sorting must not be treated as implemented until verified in the current API. Any backend/API work is out of scope for Phase 1.

### 5.4 Product detail (target screen; not currently implemented in verified frontend)

**Goal:** Give each item the information and confidence needed to purchase.

**Target layout**

- Breadcrumbs at top.
- Two-column desktop: image gallery left, purchase information right.
- Main image plus thumbnails; image zoom only if it improves inspection.
- Product name, SKU, price, actual stock state, variant selector only if variants are represented in the data model, quantity control and add-to-cart action.
- Product description and technical specifications in a clearly scannable layout.
- Shipping/returns information only when the project has real policy data; otherwise use a neutral demo notice.
- Related products from real catalogue data.
- Contextual `Ask about this product` entry can be added when the assistant can receive product context.

**Data rule:** Do not invent ratings, reviews, discount percentages, comparison claims, or variant options. The currently verified API includes a product detail endpoint, but the frontend detail route and rich gallery data are not present in the verified snapshot. Confirm the latest API response schema before implementing.

### 5.5 AI shopping concierge (`/assistant` and any optional drawer)

**Goal:** Make product discovery feel guided, useful and trustworthy.

**Full-page experience**

- Strong but restrained page heading: `Tell us what you need.`
- Conversation/input area with example prompts such as laptop budget/use case, headphone feature preference, or smartwatch purpose.
- Display the assistant’s explanation above a set of rich product cards.
- Results use the same product card design as the main catalogue.
- Each result should show why it was selected only when grounded in data returned by the service.
- Include an explicit empty/no-match state and a helpful suggestion to broaden the criteria.
- State that recommendations are catalogue-based and deterministic while the current service remains rule-based.

**Optional side drawer (seen in recording, not in verified main)**

- Opens from one persistent `Ask ShopPilot` launcher.
- Desktop width approximately 380–440px; mobile becomes a full-height sheet/page.
- Header: `ShopPilot Concierge`, short honest capability label, close action.
- Message body with customer prompts and recommendation responses.
- Rich, compact product previews with image, title, price and add/view action.
- Input stays pinned to bottom with keyboard-safe spacing.
- Drawer must not cover checkout fields or critical page controls without a dismissible overlay.

**Current capability constraints**

- Current endpoint: `POST /api/v1/assistant/recommendations`.
- The service is rule-based and queries real catalogue products.
- There is no verified LLM orchestration, persistent conversation history or autonomous tool execution.
- Do not show fake typing/thinking, simulated tool calls, invented citations, order actions, or “personalized memory”.
- Any assistant UI must call the existing API and display its actual response.

### 5.6 Login and registration (`/login`, `/register`)

**Goal:** Make account access feel part of the brand, not a generic form modal.

**Desktop**

- Split composition: one side uses a restrained product/editorial image or dark brand panel; the other contains the form on warm canvas/white surface.
- Keep form width around 380–440px.
- Clear title and one-line explanation.
- Inputs use consistent 44–48px height, visible labels, clear error text and focus state.
- Primary action uses Obsidian fill; alternate auth link is text-based.

**Mobile**

- Single-column form, no cramped split panel.
- Keep brand mark and heading visible without oversized empty areas.

**Behavior constraints:** Preserve existing `AuthContext`, login/register request payloads, JWT handling, redirects, password constraints and error handling. Do not add social login or password reset unless backend support exists.

### 5.7 Cart and checkout (`/cart`)

**Goal:** Reduce friction and make cost and delivery details unambiguous.

- Clear `Your bag`/`Shopping bag` page title and item count.
- Desktop two-column composition: items left, sticky order summary/checkout panel right.
- Product thumbnail, name, SKU, unit price, quantity selector and remove action.
- Show line totals and subtotal calculated from server-returned cart data; never trust client prices.
- Delivery form should be organized into recipient, contact and address groups.
- Clear explanation that checkout is currently a demo flow and no real payment is collected.
- Mobile: summary moves below items or becomes a non-obstructive sticky summary; do not cover form inputs.

**Behavior constraints:** Keep cart API operations, checkout payload, order invalidation and success route exactly compatible. Do not introduce payment UI that implies a real payment gateway.

### 5.8 Order history (`/orders`)

**Goal:** Give customers confidence and an easy-to-scan record of purchases.

- Editorial page heading and concise supporting text.
- Order cards with order number, date, status, purchased items and total.
- Status color must remain secondary and include text (not color-only).
- Empty state links to the actual collection/discover route.
- Order confirmation banner appears only for an order identifier returned by checkout.

**Behavior constraints:** Preserve customer-scoped order query and response schema. Do not fabricate shipment timeline or tracking carrier details; current application has order history, not a verified logistics integration.

### 5.9 Admin workspace (`/admin`)

**Goal:** Keep administration efficient, readable and visually consistent without making it look like a separate product.

- Admin heading, compact context and clear section structure.
- Product create form and inventory/product list separated by layout or tabs only if both remain discoverable.
- Strong label/input hierarchy; visible mutation loading and error/success states.
- Product row should expose name, SKU, price, active state, stock and available admin actions.
- Image upload control must look intentional and show selected filename/progress/result if supported by current upload API.
- Destructive/deactivation action should be visually distinct and not look like a primary purchase CTA.

**Behavior constraints:** Keep admin route protection and server-side role enforcement. Preserve current product create/update/deactivate/image upload endpoints. Do not add category management or admin order fulfilment in a purely visual phase.

### 5.10 Mobile and responsive system

Required review widths:

- 1440px wide desktop.
- 1280px laptop.
- 1024px small laptop/tablet landscape.
- 768px tablet.
- 390px common phone.
- 320px narrow phone.

Rules:

- No horizontal page overflow.
- Header remains usable and does not wrap into accidental navigation rows.
- Buttons and inputs have comfortable touch targets (aim for 44px minimum height).
- Product images retain predictable aspect ratio.
- Filter and AI drawers become full-height sheets on mobile.
- Text never clips due to fixed-height containers.
- Product detail purchase action remains easy to reach.

## 6. Product photography and asset direction

Photography is the most important quality lever after layout. The current recording shows repeated headphone photos, inconsistent image ratios, and at least one broken product image. This makes the experience feel unfinished even when the CSS is polished.

### Art direction

- Technology products photographed on warm alabaster, stone, muted taupe, or controlled studio backgrounds.
- Soft directional lighting and natural shadow; no heavy tinted overlays.
- Consistent exposure and white balance across the catalogue.
- Prefer 4:5 portrait assets for product cards; use wide 16:9 or 3:2 assets for campaign/editorial panels.
- For small devices, use a clean isolated product shot rather than a busy lifestyle image.

### Asset-management requirements

1. Inventory all existing `image_url` values and identify duplicates, missing files, 404s, and unsuitable aspect ratios.
2. Do not randomly map one image to unrelated products.
3. Do not hotlink arbitrary remote assets. Use approved, licensed assets or local assets checked into an explicitly named public asset directory.
4. Keep source attribution/license records for third-party imagery in `docs/assets/IMAGE_SOURCES.md` or equivalent.
5. If there is no approved image for a product, show a designed placeholder with product initials/type—not a broken image icon.
6. Add `onError` fallback behavior to image elements or a reusable `ProductImage` component.

### Phase 1 limitation

Phase 1 may create the reusable image stage/fallback and inventory image data, but must not invent or bulk-reassign production catalogue image URLs. Curated image replacement can be a separate data/content task.

## 7. Content and microcopy rules

- Prefer concrete language over generic marketing claims.
- Never claim “AI-powered” behavior beyond the exact current recommendation service.
- Never fabricate ratings, review totals, delivery estimates, discount labels, stock, scarcity or testimonials.
- Use Indian locale and currency consistently where product prices are INR (`₹` and `en-IN` formatting).
- Use sentence case for UI labels; reserve uppercase for small overlines/eyebrows.
- Keep button labels action-oriented: `Explore collection`, `Add to bag`, `Update quantity`, `Place demo order`, `Ask about this product`.
- Use the term “bag” or “cart” consistently; do not mix both arbitrarily.

## 8. Delivery phases and scope boundaries

### Phase 1 — Brand foundation and storefront first impression

**Purpose:** Make the verified existing homepage and shared shell feel distinctive and cohesive, without changing backend or transactional behavior.

Included:

- Repository/source reconciliation and preservation of local-only work.
- Centralized semantic design tokens and typography system.
- Shared header/navigation, footer, page-width and responsive layout rules.
- Consistent buttons, links, form controls, labels, focus states and feedback states.
- Homepage hero redesigned as an editorial, image-led campaign composition.
- Refined featured catalogue heading, product image stage, product card and add-to-cart presentation.
- Reliable missing/broken product-image fallback.
- Responsive behavior and keyboard/reduced-motion checks.
- Update design-system documentation and README index.

Excluded:

- Any FastAPI, PostgreSQL, SQLAlchemy, Alembic, authentication, inventory, cart or order logic changes.
- New backend endpoints or changed API response contracts.
- New database fields or migrations.
- New product/collection/detail page routes unless they already exist in the current uncommitted working tree and can be preserved without changing behavior.
- LLM integration, conversation persistence, agent tools or new assistant capabilities.
- Real payment processing, logistics, reviews, ratings or promotional systems.
- Large new UI dependencies unless justified and explicitly documented.

### Phase 2 — Collection and product discovery

Implement/complete collection route, real search/filter/sort behavior based on verified API support, category content, and product detail page. Any missing backend functionality must be separately scoped and tested.

### Phase 3 — Assistant experience

Polish full-page concierge and optional side drawer using the current rule-based service. Future LLM integration must be a separate backend architecture milestone.

### Phase 4 — Transactional and account experience

Polish auth, cart, checkout, order history and admin screens without changing their business behavior. Add frontend interaction tests.

### Phase 5 — Advanced commerce and production readiness

Variants, saved addresses, payment integrations, returns, order fulfilment, agent audit trail, security hardening and then DevOps/cloud work—each as separate, testable increments.

## 9. Phase 1 acceptance criteria

Phase 1 is complete only when all of the following are true:

### Visual

- The homepage clearly reads as a premium curated technology store, not a generic SaaS hero.
- Alabaster/Obsidian palette is applied consistently using semantic tokens.
- Instrument Serif, Manrope and DM Sans have clear, restrained roles.
- Homepage uses a real approved product/editorial image or a deliberate composed fallback—not the old generic orbit/card illustration.
- Product cards have consistent image-stage proportions, clear information hierarchy and refined add-to-cart treatment.
- No unrelated repeated or broken images are visible; unknown assets use a designed fallback.
- Header and footer look intentional at desktop and mobile widths.

### Functional preservation

- The homepage still loads products from the current API.
- Existing logged-in add-to-cart flow remains unchanged.
- Cart count and auth/account navigation behave as before.
- All existing routes remain reachable and protected as before.
- Assistant requests still use the existing recommendation endpoint and accurately describe its current rule-based capability.
- No backend source, migration, API schema or database code changes are introduced in Phase 1.

### Quality

- `npm run typecheck` passes.
- `npm run build` passes.
- No console errors or missing key assets on the homepage.
- No horizontal overflow at the review widths.
- Focus visibility and reduced-motion behavior are verified.
- Manual checks include logged-out and logged-in states, API loading/error/empty states, and mobile navigation.
- PR description lists files changed, screenshots, test results, and any known limitations.

## 10. Review checklist

- [ ] Confirmed correct branch and clean/understood working tree before changes.
- [ ] Preserved local-only UI or reported the difference before modifying it.
- [ ] No backend/API/database changes.
- [ ] No fabricated product or marketing data.
- [ ] Product imagery is approved, consistent and has fallback behavior.
- [ ] All existing routes and interactions remain intact.
- [ ] Responsive desktop/tablet/mobile screenshots attached.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] Accessibility and reduced-motion basics checked.
- [ ] PR is reviewable and limited to Phase 1.

---

**Design decision:** ShopPilot should feel like an editorial technology retailer with an intelligent concierge as a differentiator. Its premium quality should be earned through product imagery, art direction, typography and excellent commerce usability—not decorative complexity.

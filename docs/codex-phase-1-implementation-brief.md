# Codex Implementation Brief — ShopPilot Phase 1

**Task:** Implement Phase 1 — Brand Foundation and Storefront First Impression  
**Repository:** `https://github.com/darshsoam07/ShopPilot`  
**Primary stack:** React 19, TypeScript, Vite, React Router, TanStack Query; FastAPI/PostgreSQL remain unchanged.  
**Design reference:** `docs/premium-ui-redesign-spec.md`  
**Design system:** Editorial Alabaster & Obsidian  
**Implementation mode:** Focused frontend-only feature branch and pull request.

---

## 0. Mission

Make the existing ShopPilot storefront look and feel like a premium, carefully curated technology commerce brand. The result must be editorial, image-led, clear, responsive and commercially credible.

This is **not** a request to rebuild the application, replace its architecture, or change backend behavior. Implement only the Phase 1 scope in the design specification.

The finished homepage should no longer look like a generic SaaS template. Replace the abstract floating-card/orbit hero with a strong product/editorial composition. Refine the shared navigation, footer, typography, spacing, product cards and image handling so that the entire first impression feels like one deliberate system.

## 1. Non-negotiable safety and preservation rules

1. **Preserve the working tree.** First inspect `git status --short --branch`, `git log -5 --oneline`, current branch, and local diffs. Never discard or overwrite existing changes.
2. **Reconcile versions.** Compare the checked-out code with `origin/main`. The 16 November screen recording shows a Collection screen, theme selector and floating Ask ShopPilot drawer that were not present in the uploaded GitHub-main archive. Search the actual current checkout for these elements. If they exist locally and are uncommitted, preserve them. Do not delete them simply because they are absent from `origin/main`.
3. **Do not run destructive Git commands.** Never use `git reset --hard`, `git clean -fd`, force push, or mass checkout to replace local files.
4. **Frontend presentation only.** Do not modify `apps/api`, FastAPI routes, Pydantic schemas, SQLAlchemy models, Alembic migrations, database configuration, JWT/auth logic, checkout/inventory logic, or API response contracts.
5. **Preserve existing React behavior.** Do not change route semantics, React Query keys, request payloads, auth state, add-to-cart mutations, checkout flows, admin permissions, or assistant endpoint calls.
6. **No fabricated data.** Do not add fake ratings, reviews, sales numbers, discount labels, stock counts, delivery promises, testimonials or product claims.
7. **No fake AI.** Current catalogue recommendations are deterministic/rule-based. Do not present them as LLM reasoning, personalized memory, autonomous agents, or real-time shopping actions.
8. **No arbitrary external images.** Do not hotlink random image URLs, scrape assets, or map the same asset to unrelated products. Use existing approved local assets/URLs after validating them. If an approved image is unavailable, use a polished fallback.
9. **Keep the dependency footprint stable.** Do not add animation, icon or UI libraries unless there is a clear need and it is documented. Prefer CSS and existing project dependencies.
10. Keep changes focused. If a requested improvement requires backend/API/data-model work or new route behavior, document it as a follow-up rather than implementing it in this phase.

## 2. Preflight audit (do this before editing)

Run and report:

```powershell
git status --short --branch
git log -5 --oneline
git branch --show-current
git fetch origin
git status -sb
```

Then inspect:

- `apps/web/package.json`
- `apps/web/src/main.tsx`
- `apps/web/src/app/App.tsx`
- `apps/web/src/styles.css`
- `apps/web/src/features/catalog/HomePage.tsx`
- `apps/web/src/features/catalog/ProductCard.tsx`
- `apps/web/src/features/assistant/AssistantPage.tsx`
- `apps/web/src/context/AuthContext.tsx`
- `apps/web/src/services/http.ts`
- `apps/web/index.html`
- `docs/design-system.md`
- `docs/premium-ui-redesign-spec.md` if it exists in the branch

Also inspect all current route components and any components used by the local-only Collection screen, AI drawer, theme selector, or floating assistant launcher.

If the branch is behind `origin/main`, do not blindly rebase or merge over local work. Explain the divergence and choose a safe branch strategy. If the user has uncommitted work, leave it untouched and build on a new branch only after confirming the worktree state.

Create a branch with a focused name such as:

```powershell
git switch -c design/phase-1-brand-foundation
```

If it already exists, do not overwrite it; inspect it and use a new suffix if needed.

## 3. Required design system

Use this exact palette:

| Role | Value |
|---|---|
| Warm Alabaster canvas | `#F9F8F6` |
| Pure White surface | `#FFFFFF` |
| Soft Linen surface | `#F2F0EC` |
| Deep Obsidian ink | `#141413` |
| Warm Slate secondary text | `#6E6D68` |
| International Vermilion accent | `#E85D34` |
| Hairline border | `#E5E3DD` |

Use semantic CSS custom properties. The merged stylesheet currently uses names such as `--canvas`, `--surface`, `--surface-soft`, `--ink`, `--muted`, `--accent` and `--border`. Preserve these names if they are still used. Do not create parallel variables or scatter repeated hex values through the stylesheet.

Typography:

- Instrument Serif: large display/editorial headlines only.
- Manrope: brand, interface headings and product titles.
- DM Sans: body, navigation, form controls, metadata and buttons.

If the fonts are already imported, reuse the imports. If not, add a reliable import with suitable fallbacks. Do not introduce four or five additional font families.

Use restrained border radii and subtle shadows. Keep text contrast strong. Vermilion is a signal color for AI/active highlights, not a general background color.

## 4. Phase 1 implementation tasks

### Task A — Shared shell and navigation

Refine the existing global header/footer and page shell.

- Strong, clean ShopPilot wordmark/mark.
- Header height around 68–76px on desktop.
- Consistent horizontal gutter and max-width alignment.
- Desktop nav has clear active/hover indicators without heavy pills.
- Logged-out state keeps sign-in and create-account actions.
- Logged-in state keeps cart count, user display, sign-out and role-based admin navigation.
- If a Collection link or AI drawer exists in local code, preserve it and restyle it. Do not invent a new nonfunctional route.
- On small screens, use a compact accessible menu rather than a crowded wrap of links.
- Preserve cart count query, logout behavior, unauthorized-event handling and route links.
- Footer should be quiet, aligned and consistent with the brand.

### Task B — Homepage hero redesign

Refactor the current homepage hero to an editorial campaign composition.

Required design characteristics:

- Warm linen/alabaster background and calm composition.
- Left: small overline, strong two-part headline, concise supporting line and one primary CTA plus optional real assistant CTA.
- Right: large real technology still-life/product image or an intentional local editorial asset composition.
- Remove the generic rotated rectangle/orbit illustration **only after** confirming it is the actual current hero and no local design mode depends on it.
- Avoid generic floating SaaS labels/chips. If overlays remain, they must correspond to real product information and be visually restrained.
- Keep hero readable at desktop and stack it naturally on mobile.
- Ensure `Explore the catalogue` navigates to the actual destination. If no collection route exists, use the current catalogue anchor and do not create an empty `/collection` route.
- If there is no approved hero image in the repo, create a refined neutral product-image stage/fallback and document the exact asset requirement. Do not use a random remote image.

Suggested copy direction:

- Overline: `TECHNOLOGY, CHOSEN WITH INTENTION`
- Headline: `Better tools.` / `Better everyday.`
- Supporting line: `Thoughtfully selected technology for work, creativity and everyday living.`
- CTA: `Explore the collection`

Copy can be refined to fit actual products, but do not overstate ShopPilot’s current AI capabilities.

### Task C — Catalogue section and shared product card

Polish the existing featured catalogue while retaining current API behavior.

- Stronger section title/description hierarchy.
- Product image stage must use consistent aspect ratio (target 4:5 portrait for card imagery).
- Use `object-fit: contain` for isolated hardware/product cutouts on neutral stage; use `cover` only for lifestyle photography where crop is intentional.
- Add graceful image error fallback. Broken image icons must never remain visible.
- Keep product name, SKU, price, stock state and add-to-cart action clear.
- Avoid redundant generic `Curated pick` badges on every item; use a badge only if it represents real curated metadata. Otherwise remove it.
- Add restrained hover elevation/image zoom only when it does not hurt touch behavior.
- Keep product prices localized using the existing `en-IN` formatting.
- Preserve authenticated add-to-cart behavior, mutation loading/success/error states and `['cart']` cache update.
- Do not add ratings, review totals, variants, discounts or brand names that do not exist in the product response.
- Use a reusable `ProductImage` component only if it simplifies consistent fallback behavior without an excessive refactor.

### Task D — Global controls and states

Ensure a coherent visual language for:

- Primary/secondary/tertiary buttons.
- Text links and navigation actions.
- Inputs, selects and textareas.
- Labels, helper text and validation errors.
- Loading, empty, error and success states.
- Focus-visible and disabled states.

Avoid broad CSS selector collisions. Prefer scoped classes or simple reusable component classes. Do not perform an unrelated rewrite of the cart, checkout or admin pages in this phase.

### Task E — Responsive and accessible behavior

Manually review:

- 1440px desktop.
- 1280px laptop.
- 1024px tablet landscape.
- 768px tablet.
- 390px phone.
- 320px narrow phone.

Requirements:

- No horizontal overflow.
- No overlapping hero copy or clipped artwork.
- Product cards remain readable.
- Header actions remain reachable.
- All controls work by keyboard.
- Visible `:focus-visible` style.
- Semantic headings, navigation landmarks and descriptive image alt text.
- Buttons have clear accessible names.
- Respect `prefers-reduced-motion`.

## 5. Asset audit

Before adding/replacing imagery:

1. Inspect current product records/seed data and all existing product image URLs.
2. Identify duplicates, missing paths, 404 URLs and inconsistent crops.
3. Preserve product-to-image relationships when they are correct.
4. Do not silently replace the product catalogue's image URLs as part of CSS styling.
5. Add fallback behavior to image rendering, and report which catalogue images still need approved assets.
6. If using new local assets, place them in a clearly named public asset directory and add source/license details in documentation.

For Phase 1 it is acceptable to implement the image system and fallback before acquiring a full curated photography set.

## 6. Explicitly out of scope

Do not implement in this PR:

- Collection route/backend filter functionality if not already present.
- Product detail page or variant management.
- New auth flows or OAuth/social login.
- AI drawer/conversation persistence or LLM/agent orchestration.
- Changes to current assistant endpoint or recommendation algorithm.
- New API calls, endpoint contracts or database schema.
- Cart/checkout/order/admin business logic changes.
- Payment, shipping, returns, reviews, ratings, discounts or promotions.
- Docker, CI/CD, Kubernetes, Terraform or observability changes.

The existing full-page Assistant, collection-related local UI (if present), account, cart, orders and admin screens should not be broken. Styling can be harmonized where required by shared tokens, but deeper redesign is later work.

## 7. Verification commands

Run from `apps/web`:

```powershell
npm install
npm run typecheck
npm run build
```

Then start the app with the already configured local API and verify:

- Homepage loads products from the real `/api/v1/products` response.
- Loading, empty and API error states still render.
- Logged-out users can navigate to login/register.
- Logged-in customers can still add a product to cart.
- Cart count updates using the existing query cache.
- Assistant page still calls `/api/v1/assistant/recommendations` and accurately describes it as rule-based.
- Cart, checkout, order history and admin routes still load as before.
- No browser console errors, React key warnings, failed local asset requests, or broken product image icons.
- Responsive checks are completed at all widths listed above.

If npm installation/build cannot run, state exactly which command failed and why. Do not claim the build passed based on static inspection.

## 8. Deliverables

1. Focused frontend changes for Phase 1 only.
2. Updated `docs/design-system.md` if token/component rules changed.
3. A short asset audit report, including missing/duplicate image findings.
4. Before/after screenshots at desktop and mobile widths.
5. Test/build output and known limitations.
6. A concise pull request with screenshots, file list, test results and explicit confirmation that backend/API behavior was not changed.

Suggested commit message:

```text
design(web): establish premium ShopPilot brand foundation
```

Suggested PR title:

```text
Design: ShopPilot Phase 1 — premium brand foundation
```

## 9. Final response format

When finished, report:

- Branch and PR URL.
- Main files changed.
- Visual changes completed.
- Existing local-only components preserved.
- API/backend files unchanged (confirm via `git diff --name-only origin/main...HEAD`).
- `npm run typecheck` result.
- `npm run build` result.
- Responsive/browser validation performed.
- Remaining image/content gaps.
- Any feature intentionally deferred to Phase 2.

Do not claim completion for any verification that was not actually executed.

# ShopPilot design system

## Direction: Bone & Oxide

Warm bone paper, near-black ink, one oxide-red signal, and a single dark band per page
where the product photograph is the brightest thing on screen. Display type is a serif;
everything operational is a clean sans. The interface stays quiet so the product carries
the color. Surfaces are flat and separated by hairlines. Depth comes from contrast and
scroll choreography, not shadows or blur.

This file is the single source of truth. `AGENTS.md` holds the rules; the tokens live in
`apps/web/src/styles/tokens.css`; the Tailwind mapping lives in `apps/web/tailwind.config.ts`.

## Color

Contrast ratios are computed (WCAG 2.x relative luminance).

| Token | Hex | Role | Contrast |
|---|---|---|---|
| `--paper` | #F3F0E8 | Page background | |
| `--surface` | #FAF8F3 | Cards, drawers, dialogs | |
| `--paper-sunk` | #EAE6DA | Inputs, image wells, table heads | |
| `--ink` | #1B1A17 | Text, primary buttons, the dark band | 15.3:1 on paper |
| `--ink-muted` | #5E5A50 | Secondary text, metadata | 6.0:1 on paper, 5.5:1 on paper-sunk |
| `--line` | #DDD8CA | Hairlines and dividers (decorative) | |
| `--line-control` | #8F8A7B | Input and control boundaries | 3.0:1 on paper |
| `--accent` | #B33D1D | Active state, focus ring, links, small marks | 5.1:1 on paper, 4.7:1 on paper-sunk, 4.8:1 on accent-soft |
| `--accent-hover` | #8F2F14 | Link and mark hover | 7.1:1 on paper |
| `--accent-soft` | #F6E7DD | Badge tint | |
| `--success` | #2F6B4F | In-stock, success (with text or icon) | 5.5:1 on paper |
| `--danger` | #8A1F2B | Errors (with text or icon) | 8.0:1 on paper |

### The dark band

`.band` sets `background: var(--band)` and flips `--ink`, `--ink-muted`, `--line`,
`--accent` and `--ink-inverse` for everything inside it. On the band: text 15.3:1,
muted (`--band-muted` #A8A396) 6.9:1, accent (`--accent-on-dark` #E8744F) 5.8:1.
Use at most one band per page; adjacent sections may share it (the home hero and campaign are one band).

### Accent restraint

Oxide is a signal, not a surface. Allowed: active nav indicator, focus ring, text links,
small status marks. Not allowed: buttons, large fills, body copy. Primary buttons are ink.
Hovering a primary button inverts it to paper with an ink border.

## Typography

| Role | Family | Package |
|---|---|---|
| Display | Instrument Serif, 400 | `@fontsource/instrument-serif` |
| UI | Instrument Sans, variable, 400 and 500 | `@fontsource-variable/instrument-sans` |
| Mono | Geist Mono, variable | `@fontsource-variable/geist-mono` |

| Token | Size | Notes |
|---|---|---|
| `--text-2xs` | 11px | Eyebrow only |
| `--text-xs` | 12px | Metadata, SKU |
| `--text-sm` | 14px | Buttons, nav, labels, form fields |
| `--text-base` | 16px | Body |
| `--text-lg` | 18px | Lead text |
| `--text-xl` | 20 to 24px | h3 (fluid) |
| `--text-2xl` | 28 to 36px | h2 (fluid) |
| `--text-3xl` | 36 to 56px | h1 (fluid) |
| `--text-4xl` | 44 to 72px | Hero (fluid) |

Fluid sizes interpolate between 360px and 1440px viewports. There are no type breakpoints.

## Space, layout, shape

- Space: 4px base, `--space-1` to `--space-24`.
- Gutter `--gutter`: 16 / 24 / 32px at mobile / 640px / 1024px. Max content `--container-max` 1200px.
- Section rhythm `--section-space`: 64px, 96px from 1024px.
- Control height `--control`: 44px. Header `--nav-height` 72px, compact 56px.
- Radius: `--radius-sm` 4px (inputs, buttons, badges), `--radius-md` 6px (cards), `--radius-lg` 10px (dialogs, drawers), `--radius-pill`.
- Elevation: none on cards. `--shadow-pop` on dropdowns, dialogs and toasts only. Overlays sit on `--scrim`, a flat 50% ink. No blur.

## Motion

Personality: weighted and editorial. Fast on interaction, scrubbed on scroll.

| Token | Value | Use |
|---|---|---|
| `--ease-out` | cubic-bezier(0.23, 1, 0.32, 1) | Entering, exiting, default |
| `--ease-in-out` | cubic-bezier(0.77, 0, 0.175, 1) | Moving on screen |
| `--ease-drawer` | cubic-bezier(0.32, 0.72, 0, 1) | Drawers and sheets |
| `--dur-press` | 120ms | Press feedback |
| `--dur-hover` | 160ms | Hover, color |
| `--dur-ui` | 220ms | Small UI state |
| `--dur-enter` | 260ms | Entrances |
| `--dur-drawer` | 380ms | Drawers and sheets |
| `--dur-reveal` | 450ms | Scroll reveals (ceiling) |

`apps/web/src/lib/motion.ts` mirrors these in seconds and adds springs, variants, scroll hooks
and the motion policy. Primitives: `Reveal`, `Stagger`, `StaggerItem`, `MaskReveal`
(`components/motion/Reveal.tsx`), `Magnetic` (`components/motion/Magnetic.tsx`),
`SmoothScroll` and `useSmoothScroll` (`components/motion/SmoothScroll.tsx`).

Policies:
- Keyboard-initiated actions (the command palette) do not animate.
- Hover motion only on `(hover: hover) and (pointer: fine)`.
- Reduced motion: movement becomes instant; color and opacity still ease. One CSS block (`base.css`) and one JS module (`motion.ts`).
- Lenis smooth wheel runs on `/` only, with `lerp` 0.18. Everything else scrolls natively so sticky layouts stay exact.
- Router navigation to a new pathname resets scroll to the top. Search-param changes do not.

## CSS architecture

```
styles/
  index.css       layer order + Tailwind directives (imported first)
  tokens.css      every custom property, plus temporary aliases
  base.css        reset, typography, focus, .band, buttons, .skeleton, reduced motion
  legacy.css      retokenized old styles.css, shrinking
  shell.css       header, navigation, chips, segmented control, shared small controls
  product-card.css product card, grid, skeleton
  overlays.css    cart drawer, shipping meter, command palette
  home.css        hero, campaign, selection
  collection.css  collection page, assistant page
  components.css  SKU selector (Phase 4)
  checkout-stepper.css  checkout stepper (Phase 4)
```

Layer order: `reset, tokens, foundation, legacy, ui, surfaces`, then unlayered Tailwind utilities.
Tailwind preflight is disabled. Tailwind utilities are available for new code; today's
components use named classes.

## Component principles

1. **Primary actions** are ink with paper text; hover inverts.
2. **Accent restraint**: see above.
3. **Surfaces**: paper for the page, surface for raised content, paper-sunk for wells. Avoid nested cards.
4. **Borders**: 1px hairlines. Control boundaries use `--line-control`.
5. **Four states** on every list or table: skeleton, empty, error, data.
6. **Accessibility**: visible focus on everything, 44px targets, no color-only state.
7. **Responsive**: verified at 320px, 360px to 390px (phones) and 1440px.

## Coverage

Styled by this system: header and navigation, footer, home hero and campaign, catalog and
product cards, PDP, cart drawer and cart page, checkout, sign-in and registration, orders,
addresses, after-sales, admin workspace, command palette, assistant page, and the shared
loading, empty, error and success states.

## Extension rules

Start from existing tokens and patterns. Keep API contracts and test hooks unchanged when
working on presentation. Add a semantic color only when a distinct state needs one, and keep it
secondary to the core palette.

## Retired

- Palettes `swiss`, `matcha`, `violet` and the `data-theme` selector (no UI set it).
- Fraunces, DM Sans, Manrope, Space Grotesk, Inter and JetBrains Mono.
- The assistant drawer. Its job belongs to the command palette and the assistant page.
- Backdrop blur and glass surfaces.

## History

See the [original asset audit](phase-1/README.md) and the [reference-guide implementation review](phase-1/editorial-review/README.md).

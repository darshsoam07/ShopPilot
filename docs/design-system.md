# ShopPilot Design System

## Direction

**Editorial Alabaster & Obsidian** is the visual foundation for ShopPilot. It combines warm, low-glare surfaces, precise ink typography, generous editorial spacing, and a restrained vermilion signal color. The interface should feel composed and premium without sacrificing the clarity expected from a commerce application.

## Core palette

| Token | Hex | Usage |
|---|---|---|
| Canvas | #F9F8F6 | Main application background |
| Surface | #FFFFFF | Product cards, forms, modals, elevated panels |
| Soft surface | #F2F0EC | Hero sections, AI panels, input backgrounds, secondary surfaces |
| Ink | #141413 | Primary text, primary buttons, brand mark |
| Muted | #6E6D68 | Secondary text, descriptions, metadata |
| Accent | #E85D34 | AI identity, active details, selected highlights, small status emphasis |
| Border | #E5E3DD | Hairline dividers and control boundaries |

## CSS custom properties

The tokens live in apps/web/src/styles.css under :root:

- --canvas
- --surface
- --surface-soft
- --ink
- --muted
- --accent
- --border

Use these tokens instead of introducing one-off hex values for routine UI styling.

## Typography

- **DM Sans** is used for body copy, labels, navigation, and controls.
- **Manrope** is used for brand/UI headings, product titles, and compact display text.
- **Instrument Serif** is reserved for large editorial hero and assistant headlines.

Use the display serif sparingly. Product information, prices, form labels, and operational controls should remain highly legible.

## Component principles

1. **Primary actions:** Obsidian background with alabaster text. Hover states invert to a light surface with an ink border.
2. **Accent restraint:** Vermilion is a signal, not a surface color. Use it for AI marks, active indicators, small highlights, and focused attention. Do not use it for long paragraphs.
3. **Surfaces:** Use white for elevated content and soft linen for grouped/supporting content. Avoid stacking too many nested cards.
4. **Borders:** Prefer subtle 1px hairlines over heavy outlines.
5. **Motion:** Use short, purposeful transitions for hover and focus. Respect prefers-reduced-motion.
6. **Responsive layout:** Preserve clear reading order and touch-friendly controls on narrow screens.
7. **Accessibility:** Keep text/background contrast strong, provide visible keyboard focus, and do not communicate success/error by color alone.

## Coverage

The global design system currently styles:

- Site header, brand mark, primary navigation, and footer.
- Landing hero and featured catalogue.
- Product cards, stock labels, and add-to-cart actions.
- Sign-in and registration forms.
- Shopping cart, checkout, and order history.
- AI recommendation interface and result states.
- Administrator product and inventory workspace.
- Shared loading, empty, error, and success states.

## Extension rules

When adding a new screen, start with the existing tokens and component patterns. Keep business logic and API contracts unchanged when working on presentation. New semantic colors should be added only when a distinct state needs them, and should remain secondary to the core palette.

## Phase 1 storefront

The homepage pairs a linen text panel with the existing Nova studio photograph. The primary action opens the full collection. The photo caption opens the collection with the Audio filter selected.

The storefront uses an 8px spacing unit, 6px control corners, 1px hairlines and 44px control heights. The header switches to a keyboard-operable menu at 1100px. The campaign stacks at 700px. Theme-specific surfaces and actions respond to the existing palette selector.

Catalogue cards use a 4:5 image stage. Product images retain their proportions. An unavailable image displays product initials with an accessible description. The purchase action, price, stock and SKU remain available when photography fails.

See the [asset audit and before/after captures](phase-1/README.md).

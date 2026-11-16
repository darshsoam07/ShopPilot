# Storefront photography and review

| Catalogue item | Evidence from the local preview | Content still needed |
| --- | --- | --- |
| Nova Wireless Headphones, five configurations | All five use the same 1200 × 800 studio photograph. The campaign reuses the local demo image. All four existing detail URLs returned HTTP 200. | Photography of the Alabaster finish and bundle contents. |
| AeroBook Pro 14 | The existing remote image loaded at 900 × 600. | A locally licensed product-specific image for offline use. |
| Pulse Smartwatch 2 | Edge blocked the existing remote image response. The homepage and collection rendered the PS initials fallback. | A reliable approved photograph of this model. |

No product records or image URLs changed. The local Nova asset already existed in the repository. Its original source and license are unverified.

## Screenshots

| Viewport | Original | Phase 1 |
| --- | --- | --- |
| Desktop, 1440px | [Before](before-1440.png) | [After](after-1440.png) |
| Tablet, 768px | | [After](after-768.png) |
| Mobile, 390px | [Before](before-390.png) | [After](after-390.png) |

## Browser verification

Edge rendered seven products from the local PostgreSQL-backed API. The homepage fit 1440, 1280, 1024, 768, 390 and 320px viewports, including the expanded mobile menu. All three brand fonts loaded. The keyboard focus outline measured 3px, and reduced-motion mode disabled smooth scrolling.

The collection link, audio filter destination, product detail page, four palettes, assistant drawer shortcut and live recommendation request were exercised. A disposable customer registered and added one item. The header count updated, the cart, checkout and order history loaded, and the admin guard redirected the customer. The signed-out admin guard redirected to sign-in. The authenticated administrator dashboard and placement of an order were outside this browser pass.

An unmatched live search exercised the empty state. A simulated failed API response exercised loading, error and retry. A deliberately failed product image exercised the initials fallback. A separate normal homepage pass recorded zero broken image elements and no console errors.

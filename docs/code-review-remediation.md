# ShopPilot — Code Review Remediation Status

Updated: 14 November 2026

This document maps the recent repository gap analysis to the current codebase. It distinguishes implemented work from remaining scope.

| Review finding | Current status | Evidence |
|---|---|---|
| Cart and order workflows absent | Addressed in first vertical slice | `models/cart.py`, `models/order.py`, cart/order schemas, services, endpoints, migration `0002_cart_orders.py` |
| Checkout stock race / total integrity | Addressed at service layer | Conditional stock decrement and order writes share one transaction; rollback on any failure |
| Assistant has no backend service | Initial endpoint implemented and UI connected | `POST /api/v1/assistant/recommendations`; authenticated `GET /api/v1/assistant/orders/{order_id}` |
| Admin product and inventory management | Initial CRUD and UI implemented | Admin-only product create/list/update/deactivate and stock update; `/admin` React route |
| Product images have no storage boundary | Addressed for local development | `app/services/storage.py`; local generated filenames, raster MIME/signature checks, size limit, `/media` static mount |
| Service layer is empty | Addressed for first modules | `cart_service.py`, `order_service.py`, `product_service.py`, and `storage.py` |
| Automated backend tests are minimal | Improved | SQLite test fixtures and tests for auth, RBAC, catalogue search, assistant recommendations, cart, checkout, stock conflict, order ownership, admin CRUD, and upload |
| Shared contracts package is empty | Intentionally reserved | FastAPI publishes `/openapi.json`; generate TypeScript contracts from it in a later dedicated workflow |
| Navbar and protected routes absent | Addressed for current customer/admin routes | Shared site header, cart count, `ProtectedRoute`, role-gated admin route |
| Centralized frontend auth state absent | Addressed | `AuthProvider`, `useAuth`, bearer-token HTTP client, 401 handling; access token kept in `sessionStorage` |
| Database readiness missing | Addressed | `/readyz` executes `SELECT 1`; `/health` remains liveness-only |
| Structured request logging missing | Addressed | JSON stdout formatter and request ID, method, path, status, and duration fields |
| Root task runner missing | Addressed | Root `Makefile` with `dev-api`, `dev-web`, `test`, `migrate`, and `seed` targets |

## Remaining work (intentionally not claimed as complete)

1. Admin order fulfilment/status management, category CRUD, and sales reporting.
2. Saved customer addresses and payment records; current checkout is a no-payment demo order.
3. LLM provider integration, conversation persistence, product comparison, return workflows, tool-call audit records, and rate limiting. The current recommendation service is deterministic and catalogue-grounded.
4. Frontend component and browser end-to-end tests; backend PostgreSQL concurrency tests.
5. Generated TypeScript contracts from OpenAPI, full accessibility/security review, and production-ready object storage.
6. Docker, CI/CD, infrastructure as code, cloud deployment, metrics, tracing, alerting, SLOs, and incident workflows.

## Validation performed

- Backend suite: 14 tests passed using isolated in-memory SQLite.
- Backend modules: Python compilation passed.
- Alembic: migrations `0001_initial` and `0002_cart_orders` applied successfully to a disposable SQLite database.
- Frontend: 18 TypeScript/TSX source files parsed without syntax diagnostics. A full `npm run build` / typecheck was not completed because dependencies were not present and the package registry was unavailable in this execution environment. Run `npm install` and `npm run build` locally before merging.
- PostgreSQL behavior and concurrent checkout under real PostgreSQL remain to be validated locally.

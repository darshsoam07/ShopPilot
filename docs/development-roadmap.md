# ShopPilot — Development Roadmap

## Milestone 0 — Foundation (complete)
- [x] Monorepo layout
- [x] React/Vite application shell
- [x] FastAPI app and liveness endpoint
- [x] PostgreSQL connection and SQLAlchemy models
- [x] Alembic initial migration
- [x] Registration/login/current-user API
- [x] Public catalogue API and sample product seeding
- [x] Local setup documentation

## Milestone 1 — Authentication (initial customer flow complete)
- [x] Registration/login UI
- [x] Session-scoped access token storage
- [x] Protected customer routes
- [x] Customer/admin role checks in API and protected admin route
- [x] Auth and basic RBAC tests
- [ ] Logout/session expiry UX polish and rate limiting
- [ ] Frontend component tests

## Milestone 2 — Catalogue (partially complete)
- [x] Product listing and text search API
- [x] Product create/update/deactivate admin API
- [x] Product image upload with local storage adapter
- [x] Basic admin catalogue and inventory UI
- [ ] Category model and CRUD
- [ ] Filters, sorting, and richer pagination controls
- [ ] Dedicated product detail page and multiple product images
- [ ] Catalogue frontend/backend edge-case tests

## Milestone 3 — Shopping workflow (core vertical slice complete)
- [x] One persistent cart per customer
- [x] Add/update/remove cart items
- [x] Checkout transaction and conditional inventory deduction
- [x] Order and order-item price/name/SKU snapshots
- [x] Customer order history and ownership enforcement
- [ ] Address book and saved delivery addresses
- [ ] Simulated payment records and order confirmation lifecycle
- [ ] Cancellation and return eligibility workflows
- [ ] More concurrency and failure-path tests against PostgreSQL

## Milestone 4 — Admin (partially complete)
- [x] Admin-only product and inventory APIs
- [x] Admin product creation and inventory screen
- [x] Local product image upload
- [ ] Category management UI
- [x] Order-status management and fulfilment view
- [ ] Sales and inventory analytics

## Milestone 5 — AI features (initial recommendation endpoint complete)
- [x] Distinct assistant API endpoint
- [x] Catalogue-grounded rule-based product recommendations
- [x] Authenticated, customer-scoped order lookup endpoint for assistant use
- [ ] Persist conversations and messages
- [ ] Product comparison tool grounded in specifications
- [ ] LLM provider integration and orchestrated tool calling
- [ ] Return-request tool with explicit confirmation
- [ ] Tool audit trail, timeouts, usage limits, provider fallback, and rate limiting

## Milestone 6 — Quality and application hardening (in progress)
- [x] Pytest fixtures and isolated test database
- [x] Authentication, RBAC, recommendation, cart, checkout, and ownership tests
- [x] Database readiness check (`/readyz`)
- [x] Request IDs and JSON request logging
- [ ] Frontend typecheck/build and automated component tests
- [ ] End-to-end customer purchase test
- [ ] Accessibility, security, and dependency reviews
- [ ] PostgreSQL integration/concurrency test suite

## Milestone 7 — Cloud / DevOps / SRE (later)
- [ ] Docker images and local Compose environment
- [ ] GitHub Actions CI and quality gates
- [ ] Cloud deployment and managed PostgreSQL
- [ ] Infrastructure as Code
- [ ] Secrets and configuration management
- [ ] Metrics, logs, traces, dashboards, and alerting
- [ ] SLOs, error budgets, load tests, backup/restore drills
- [ ] Failure injection and incident runbooks

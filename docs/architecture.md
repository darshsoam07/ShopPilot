# ShopPilot — Architecture

## Architectural style

Start with a modular monolith. The React frontend and FastAPI API are separate applications in one repository; the API owns business rules, authorization, and persistence. Do not split into microservices until load, ownership, or release constraints justify the operational cost.

## Current request paths

```text
Browser (React + TypeScript)
   | REST / JSON
   v
FastAPI router
   | auth dependencies + Pydantic validation
   v
Application service
   | SQLAlchemy session / transaction
   v
PostgreSQL
```

Checkout is one transaction: the service reads the customer's cart, conditionally decrements inventory, writes the order and item snapshots, clears the cart, and commits. Any failed inventory condition rolls the whole transaction back.

Product images currently use a local adapter:

```text
Admin upload -> storage service -> local MEDIA_DIR -> /media/<generated-file>
```

The admin endpoint does not write uploaded filenames directly to a user-controlled path. Only JPEG, PNG, and WebP are accepted, the file size is bounded, and the content signature is checked. Replace the local adapter with an S3/MinIO implementation for a cloud deployment.

## AI integration boundary

The current `/api/v1/assistant/recommendations` endpoint is a deterministic, catalogue-grounded first step. It queries active, in-stock products and returns only database-backed records. It is intentionally not described as a generative AI agent yet. `/api/v1/assistant/orders/{order_id}` is an authenticated, customer-scoped lookup endpoint suitable for future assistant tooling.

Future AI request path:

```text
Chat UI -> Agent API -> intent / orchestration
                       -> typed, permission-checked tools
                       -> existing application services -> PostgreSQL
                       -> grounded response + audit record
```

Agents must not bypass services, accept a customer identity from model-generated arguments, or receive unrestricted database credentials. Mutating operations must remain subject to explicit customer confirmation and normal business validation.

## Backend layers

- `api`: HTTP routes, dependencies, and authorization boundaries.
- `schemas`: Pydantic request/response contracts.
- `models`: SQLAlchemy persistence models.
- `services`: business rules, storage abstraction, and transaction boundaries.
- `agents`: reserved for future orchestration and typed tool definitions.
- `core`: configuration, password/JWT security, structured logging.
- `db`: engine, sessions, and declarative base.

## Frontend layers

- `app`: app shell and routing.
- `context`: authenticated user/session state.
- `features`: auth, catalogue, assistant, cart, orders, and admin workflows.
- `components`: reusable routes/layout and presentation components.
- `services`: HTTP client with bearer token attachment and unauthorized-session handling.
- `types`: feature-owned frontend types. `packages/contracts` remains reserved for types generated from FastAPI OpenAPI.

## Operational hooks (not a DevOps implementation)

- `/health` is a liveness endpoint; it does not assert that PostgreSQL is available.
- `/readyz` executes `SELECT 1` and returns 503 if the database is unavailable.
- HTTP request logs are JSON on stdout and include request ID, method, path, status code, and duration.
- The `X-Request-ID` response header lets a caller correlate a request with its log entry.

These hooks prepare the application for later probes and log collection. They do not replace metrics, traces, dashboards, alerting, SLOs, or production observability.

## Important data integrity rules

- The authenticated principal determines cart and order ownership.
- Never trust browser-supplied prices or stock values.
- Checkout totals are calculated from server-side product prices.
- Inventory deduction is conditional and transactional to prevent overselling.
- Order items retain product name, SKU, and unit price snapshots.
- A successful checkout currently creates a demo order only; no real payment is collected.

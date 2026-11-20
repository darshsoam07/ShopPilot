# ShopPilot

ShopPilot is an AI-ready e-commerce application designed to become a practical Cloud / DevOps / SRE portfolio project. The current objective is to build a sound, understandable product using React + TypeScript, Python + FastAPI, and PostgreSQL. Infrastructure automation and production cloud deployment remain a later phase.

## Current implementation status

The repository now contains a working application foundation and an initial transactional e-commerce vertical slice:

- React + TypeScript + Vite storefront, registration/login pages, protected customer routes, cart, checkout, order history, AI recommendations, and a basic administrator product screen.
- FastAPI registration/login/JWT authentication, current-user lookup, public product catalogue, customer cart and order APIs, an initial catalogue recommendation endpoint, and protected administrator product endpoints.
- SQLAlchemy models and Alembic migrations for users, products, carts, cart items, orders, and order items.
- Atomic stock deduction during checkout, server-calculated totals, and immutable product name/SKU/price snapshots on order items.
- Local product-image storage behind a service abstraction; the implementation can later be replaced by S3 or MinIO.
- `/health` liveness endpoint, database-aware `/readyz`, request IDs, and JSON request logs.
- Pytest integration tests for authentication, RBAC, assistant recommendations, cart/checkout, inventory conflicts, order ownership, readiness, admin product actions, and image storage.

Still planned: category management, payment gateway integration, real LLM orchestration/conversation persistence, richer recommendation personalization, frontend automated tests, and production security hardening. AI recommendations currently use a deterministic catalogue-query service, not a generative model. Checkout creates a demo order and does not collect payment.

## Product documentation

- [Product Requirements Document](docs/product-requirements-document.md)
- [Architecture](docs/architecture.md)
- [Database model](docs/database-schema.md)
- [Development roadmap](docs/development-roadmap.md)
- [Code review remediation status](docs/code-review-remediation.md)
- [Design system — Editorial Alabaster & Obsidian](docs/design-system.md)
- [Initial requirements summary](docs/requirements.md)

## Repository structure

```text
shoppilot/
├── apps/
│   ├── web/                  # React + TypeScript + Vite
│   └── api/                  # FastAPI + SQLAlchemy + Alembic
├── packages/contracts/      # Reserved for generated/shared API contracts
├── docs/                    # Product and engineering documentation
├── infra/                   # Reserved for later DevOps implementation
├── scripts/                 # Repository-level helper scripts
├── Makefile
└── README.md
```

## Prerequisites

- Git
- Python 3.11 or newer
- Node.js 20 or newer and npm
- PostgreSQL 15 or newer

The application is not containerized yet. Run PostgreSQL locally during this product-development phase.

## 1. Initialize Git

```powershell
git init
git add .
git commit -m "chore: initialize ShopPilot"
```

## 2. Create the PostgreSQL database

Example SQL in `psql` or pgAdmin:

```sql
CREATE USER shoppilot WITH PASSWORD 'change-me';
CREATE DATABASE shoppilot OWNER shoppilot;
```

Use a unique password outside a disposable local environment.

## 3. Configure and start the backend

From the repository root, in PowerShell:

```powershell
cd apps/api
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `apps/api/.env` with your PostgreSQL credentials and a long random `SECRET_KEY`. `MEDIA_DIR` defaults to `media` under the API working directory; uploaded development images are not committed to Git.

Apply migrations and start the API:

```powershell
alembic upgrade head
python -m uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000` and Swagger at `http://localhost:8000/docs`.

Useful endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Liveness check |
| GET | `/readyz` | Readiness check including `SELECT 1` against the database |
| POST | `/api/v1/auth/register` | Register a customer |
| POST | `/api/v1/auth/login` | Issue an access token |
| GET | `/api/v1/auth/me` | Get the authenticated user |
| GET | `/api/v1/products` | Public product catalogue with text search and pagination |
| GET | `/api/v1/products/{product_id}` | Get an active product |
| GET | `/api/v1/cart` | Get the current customer's persistent cart |
| POST | `/api/v1/cart/items` | Add a product to the cart |
| PATCH | `/api/v1/cart/items/{item_id}` | Change cart quantity |
| DELETE | `/api/v1/cart/items/{item_id}` | Remove a cart item |
| POST | `/api/v1/orders/checkout` | Create a demo order and deduct inventory atomically |
| GET | `/api/v1/orders` | List the authenticated customer's orders |
| GET | `/api/v1/orders/{order_id}` | Get one owned order |
| POST | `/api/v1/assistant/recommendations` | Catalogue-grounded, rule-based product recommendations |
| GET | `/api/v1/assistant/orders/{order_id}` | Authenticated customer order lookup for assistant tooling |
| GET | `/api/v1/admin/orders` | Admin order history across customers. Filter by status and paginate with limit (1�100) and offset. |
| PATCH | `/api/v1/admin/orders/{order_id}/status` | Admin fulfillment. Send the next status in the status field. Invalid transitions return 409. |
| GET/POST | `/api/v1/addresses` | List or create owned delivery addresses. |
| PATCH/DELETE | `/api/v1/addresses/{address_id}` | Edit, set default or delete an owned address. |
| GET | `/api/v1/payments`, `/api/v1/payments/{payment_id}` | List or read owned simulated attempts. No real money or payment credentials are collected. |
| GET/POST | `/api/v1/admin/products` | List/create products (admin only) |
| PATCH/DELETE | `/api/v1/admin/products/{product_id}` | Update/deactivate products (admin only) |
| POST | `/api/v1/admin/products/{product_id}/image` | Upload an image to local development storage |

Public registration always creates a `customer`. To bootstrap a local administrator, first register a normal account, then promote it directly in your local PostgreSQL database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

Do not expose role changes through public registration. The Admin navigation and `/admin` route are shown only to an authenticated account whose backend user role is `admin`; the API independently checks that role on every admin request.

## 4. Seed sample products

Open another terminal, activate the backend virtual environment, then run from `apps/api`:

```powershell
python -m scripts.seed_products
```

## 5. Start the frontend

Open a second terminal at the repository root:

```powershell
cd apps/web
npm install
Copy-Item .env.example .env
npm run dev
```

Open `http://localhost:5173`. The frontend expects the API at `http://localhost:8000` by default.

## 6. Run tests

From `apps/api`, activate the virtual environment and run:

```powershell
python -m pytest -q
```

Tests use an isolated in-memory SQLite database; local development and deployments use PostgreSQL through `DATABASE_URL`.

## Root Makefile targets

From the repository root, use `make dev-api`, `make dev-web`, `make test`, `make migrate`, or `make seed`. These are convenience commands; on Windows without GNU Make, use the equivalent commands in this README.

## Engineering conventions

- Keep HTTP concerns in `app/api`, business rules in `app/services`, persistence models in `app/models`, and request/response contracts in `app/schemas`.
- Do not let AI agents query tables directly. Future agents must call explicit, permission-checked service tools.
- Never trust client-supplied prices or stock. The backend/database is authoritative.
- Checkout uses a conditional inventory update inside one database transaction to prevent overselling; order items preserve purchase-time name, SKU, and unit price.
- Use Alembic migrations for schema changes; do not rely on `create_all()` in application startup.
- The current local image-storage adapter is development-only. Replace it with object storage and private upload controls before production.
- Add tests with each feature. Add Docker, CI/CD, Terraform, Kubernetes, and full observability only after the application workflows are stable.

## Next implementation milestones

1. Expand catalogue with categories, filtering/sorting, and detail pages.
2. Extend cancellation and return eligibility.
3. Persist AI conversation history, implement comparison tools, and add audit records and provider integration.
4. Add frontend component/end-to-end tests and security hardening.
5. Evolve the product into the Cloud / DevOps / SRE workload: containers, CI/CD, cloud hosting, IaC, observability, SLOs, load testing, and incident runbooks.

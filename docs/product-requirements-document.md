# ShopPilot — Product Requirements Document (PRD)

| Field | Value |
|---|---|
| Product | ShopPilot — AI-assisted e-commerce platform |
| Document type | Product Requirements Document |
| Version | 1.0 |
| Status | Draft baseline for implementation |
| Last updated | 14 November 2026 |
| Product owner | Project team |
| Primary audience | Developers, reviewers, project evaluators, and future contributors |
| Product phase | Application-first; Cloud / DevOps / SRE work follows the functional application |

> **Document purpose:** This PRD defines what ShopPilot must do, who it serves, how success will be assessed, and what is deliberately excluded from the first application release. It is the product-level source of truth. The architecture and development roadmap documents explain how and when the requirements are implemented.

---

## 1. Executive summary

ShopPilot is a full-stack e-commerce web application with AI-assisted product discovery and customer support. Customers can discover products, manage a cart, complete a simulated checkout, and view orders. Administrators can manage the catalogue, inventory, and order lifecycle. AI agents provide natural-language assistance using verified application data and permission-checked backend tools.

The first objective is a coherent, reliable application built as a **modular monolith** with a React + TypeScript frontend, Python + FastAPI backend, and PostgreSQL database. The application will be developed and validated locally before adding containerization, CI/CD, cloud infrastructure, Kubernetes, infrastructure as code, observability, and SRE practices.

### Product statement

> Help customers find and buy suitable products with less effort, while giving administrators a clear way to manage the catalogue, stock, and orders—and make the application a credible workload for later Cloud / DevOps / SRE engineering.

## 2. Background and problem statement

A typical student e-commerce project often stops at a static product grid, a basic cart, and a few CRUD endpoints. That demonstrates basic web development but does not establish a realistic business workflow or create a sufficiently rich workload for later reliability and operations engineering.

ShopPilot addresses this by combining:

1. A complete, end-to-end commerce workflow.
2. Separate customer and administrator experiences.
3. AI assistance grounded in the live product catalogue and the signed-in customer's permitted data.
4. Explicit data-integrity, security, and audit requirements.
5. A maintainable repository and modular application structure that can later be deployed and operated in the cloud.

## 3. Goals and non-goals

### 3.1 Product goals

- **G-01:** Deliver a usable customer storefront with product discovery, cart, checkout, and order history.
- **G-02:** Deliver a protected admin experience for managing products, categories, inventory, and orders.
- **G-03:** Add AI-assisted shopping, comparison, and order support that uses real application data.
- **G-04:** Protect customer information and enforce all business rules in the backend, not in the browser or in an LLM prompt.
- **G-05:** Keep the codebase understandable and testable for a developer learning full-stack engineering.
- **G-06:** Preserve a clean path toward later Cloud / DevOps / SRE work without introducing infrastructure complexity before the product is functional.

### 3.2 Non-goals for the first application release

- Production payment processing, stored card details, or handling payment-card data.
- Real courier integrations, live shipment carrier tracking, or automated shipping label generation.
- Microservices, service mesh, event streaming, or distributed transactions.
- Kubernetes, Terraform, production cloud deployment, CI/CD pipelines, and a full observability stack.
- Autonomous AI actions that charge money, submit an order, issue a refund, or cancel an order without explicit user authorization.
- A multi-vendor marketplace, seller onboarding, auctions, subscriptions, or a loyalty-points system.
- Native Android or iOS applications.

These items may be considered in later versions, but they are not release blockers for the first working application.

## 4. Target users and roles

### 4.1 Customer

A person who wants to browse products, find an item that meets their needs and budget, buy it, and understand the status of their order.

**Needs:**
- Find products without navigating an unnecessarily complex catalogue.
- Understand product price, features, and availability before purchase.
- Keep selected items in a cart between visits or sessions, subject to the selected authentication model.
- Place an order with a clear total and confirmation.
- View only their own profile, addresses, cart, and orders.
- Ask product and order questions in natural language.

### 4.2 Administrator

A trusted operator responsible for maintaining the store's catalogue and fulfilment workflow.

**Needs:**
- Create, edit, activate, deactivate, and review products and categories.
- Adjust inventory with a traceable reason.
- Inspect orders and move them through allowed status transitions.
- View basic operational summaries, such as order counts and low-stock products.
- Review AI tool activity and failures without exposing unnecessary customer secrets.

### 4.3 System / AI assistant

The AI assistant is an application capability, not an independent privileged user. It can only invoke explicit backend tools and only within the permissions of the authenticated user and the relevant workflow.

## 5. Product experience and major journeys

### 5.1 Customer journey

1. Customer opens the storefront and explores featured categories or products.
2. Customer searches, filters, sorts, or asks the AI Shopping Agent to find products.
3. Customer opens a product detail page and checks the specifications, price, and stock state.
4. Customer adds the item to the cart and adjusts the quantity.
5. Customer signs in or registers if required to continue checkout.
6. Customer selects or enters a delivery address and reviews the server-calculated order summary.
7. Customer completes a clearly labelled simulated payment step.
8. The application creates the order, updates stock transactionally, and shows an order confirmation.
9. Customer opens order history to review the order and its current status.
10. Customer can ask the Order Support Agent about an order belonging to their account.

### 5.2 Administrator journey

1. Administrator signs in with an administrator account.
2. Administrator opens the admin dashboard.
3. Administrator creates or updates a product and assigns it to a category.
4. Administrator sets or adjusts available inventory.
5. Administrator reviews new orders and updates order status through valid transitions.
6. Administrator reviews basic sales / inventory summaries and AI action audit records when needed.

### 5.3 AI shopping journey

Example request: “Find a laptop under ₹60,000 with at least 16 GB RAM for programming.”

1. The assistant extracts structured constraints such as category, maximum budget, and minimum RAM.
2. The backend searches the active catalogue using those constraints.
3. The assistant presents only returned products and attributes, with an explanation of why each result matches.
4. The customer can open a product, compare results, or ask to add an item to the cart.
5. Any cart mutation is validated by the backend and follows the application's normal confirmation and authorization rules.

The budget is an illustrative example, not a hard-coded product or pricing requirement.

## 6. Scope by release

### 6.1 MVP — working e-commerce application

The MVP is the minimum end-to-end customer and admin application. It must work without an AI provider being available.

- Customer registration, login, logout, and profile retrieval.
- Customer/admin role enforcement.
- Product catalogue, categories, product details, search, filters, sorting, and pagination.
- Persistent customer cart and quantity changes.
- Address selection / management for checkout.
- Server-side price and stock validation.
- Checkout using a simulated payment outcome.
- Order creation, order item snapshots, and customer order history.
- Admin product, category, inventory, and order management.
- Basic automated tests for critical user journeys.

### 6.2 AI enhancement release

- AI Shopping Agent for natural-language catalogue discovery.
- AI Comparison Agent for side-by-side product comparison.
- AI Order Support Agent for authenticated, customer-scoped order lookup and explanations.
- Return request assistance with eligibility checks and explicit confirmation.
- Product recommendation capability, initially based on simple, explainable rules or catalogue attributes.
- Conversation storage, tool-execution audit metadata, request limits, timeouts, and provider failure handling.

### 6.3 Later Cloud / DevOps / SRE phase

This phase begins after the application has a reliable local development and test workflow.

- Container images and a local multi-container development environment.
- CI checks for linting, type checking, tests, migrations, and build artifacts.
- Cloud deployment and managed PostgreSQL.
- Infrastructure as Code, secrets/configuration management, and environment separation.
- Structured logs, metrics, traces, dashboards, and actionable alerts.
- Load testing, SLOs, error budgets, backup/restore tests, and incident runbooks.
- Failure testing and operational readiness exercises.

## 7. Functional requirements

Priority definitions: **P0** = required for MVP; **P1** = required for the AI/admin-enhanced release; **P2** = valuable follow-up after the core application is stable.

### 7.1 Authentication, identity, and access control

| ID | Priority | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-AUTH-01 | P0 | A visitor can register a customer account using required profile fields and a unique email address. | Valid details create one customer account; duplicate email and invalid input return safe, understandable errors; passwords are never stored in plaintext. |
| FR-AUTH-02 | P0 | A registered customer can log in and obtain an authenticated session/token. | Valid credentials succeed; invalid credentials fail without disclosing whether an email exists; token/session expiry is enforced. |
| FR-AUTH-03 | P0 | An authenticated user can retrieve and update permitted profile details. | The API derives the account identity from the authenticated principal; users cannot read or update another user's profile. |
| FR-AUTH-04 | P0 | The application supports customer and administrator roles. | Protected admin API routes reject unauthenticated and customer users; role checks are enforced server-side. |
| FR-AUTH-05 | P0 | A user can end their authenticated session. | Logout invalidates or removes the applicable client session state; protected UI and APIs no longer treat the user as authenticated. |
| FR-AUTH-06 | P1 | Authentication endpoints are protected against basic abuse. | Rate limiting or an equivalent abuse-control mechanism is applied to login and registration; failures are logged without storing credentials. |

### 7.2 Catalogue and product discovery

| ID | Priority | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-CAT-01 | P0 | Customers can view active products in a paginated catalogue. | Only active products are exposed to customers; each result includes the fields required by the product card; pagination metadata is correct. |
| FR-CAT-02 | P0 | Customers can view a product detail page. | The page displays name, description, SKU where applicable, price, images, category, product attributes, and availability returned by the API. |
| FR-CAT-03 | P0 | Customers can search products by relevant text. | Search is performed by the backend; empty and no-result states are handled; user-supplied search text is safely parameterized. |
| FR-CAT-04 | P0 | Customers can filter by category and supported product attributes. | Selected filters are reflected in the request and results; filters can be cleared; invalid filters return a validation error or an empty result as appropriate. |
| FR-CAT-05 | P0 | Customers can sort and paginate catalogue results. | Supported sort keys and direction are allow-listed; pagination has safe limits; ordering is deterministic for equal values. |
| FR-CAT-06 | P1 | Administrators can create, update, activate, deactivate, and delete/archive products and categories. | Only administrators can mutate catalogue records; required fields and uniqueness constraints are validated; deactivated products disappear from customer browsing. |
| FR-CAT-07 | P1 | Product attributes support structured comparison. | Attributes are stored and returned in a consistent form suitable for filtering and comparison; unsupported or missing attributes are not fabricated. |

### 7.3 Cart and checkout

| ID | Priority | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-CART-01 | P0 | An authenticated customer can create or retrieve their active cart. | A customer has at most one active cart under the chosen data model; cart access is scoped to the authenticated account. |
| FR-CART-02 | P0 | A customer can add a product to the cart and change or remove its quantity. | Quantity must be a positive integer; inactive or unavailable products cannot be added; duplicate product lines are merged or rejected consistently. |
| FR-CART-03 | P0 | The cart displays current product information and a calculated subtotal. | Displayed price is retrieved from the server; client-supplied price is never trusted; unavailable items are clearly identified before checkout. |
| FR-CART-04 | P0 | A customer can select or manage a delivery address. | Address data is validated; customers can only select or modify their own addresses. |
| FR-CART-05 | P0 | A customer can review and submit checkout. | The backend recalculates totals and validates product status, price, and inventory at submission time; invalid checkout does not create a partial order. |
| FR-CART-06 | P0 | The application supports a simulated payment result. | The UI clearly identifies the payment as simulated; a test success/failure result is recorded; no real card details are collected or stored. |
| FR-CART-07 | P0 | Successful checkout creates an order and reduces stock safely. | Order, order items, payment simulation record, and inventory changes commit atomically; concurrent attempts cannot oversell available stock. |
| FR-CART-08 | P0 | Checkout submission is protected against accidental duplicate orders. | A client-generated idempotency key or equivalent duplicate-submission control prevents the same checkout request from creating multiple orders. |

### 7.4 Orders and returns

| ID | Priority | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-ORD-01 | P0 | Customers can view their own order history and order details. | The API scopes results to the authenticated user; requests for another customer's order do not reveal its details. |
| FR-ORD-02 | P0 | The application records order status and status timestamps. | Orders use a defined status model; invalid transitions are rejected; the customer sees a human-readable current status. |
| FR-ORD-03 | P0 | Order items preserve purchase-time data. | Each item stores product name/SKU and unit price snapshots plus quantity; later product edits do not rewrite historical order details. |
| FR-ORD-04 | P1 | Administrators can review orders and update their status. | Admin-only access is enforced; allowed transitions are validated; the actor and time of status changes are recorded. |
| FR-ORD-05 | P2 | Customers can request a return for an eligible order item or order. | Ownership, status, and configurable return-window rules are checked; a request is created for review; request creation does not imply a refund. |

### 7.5 Inventory and administration

| ID | Priority | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-ADM-01 | P1 | Administrators can view an inventory list and stock level. | The list is paginated and searchable; customers cannot access administrative inventory views. |
| FR-ADM-02 | P1 | Administrators can adjust inventory. | Adjustments validate quantity and record actor, timestamp, and reason; direct stock changes are not exposed to customers or AI without authorization. |
| FR-ADM-03 | P1 | Administrators can view basic order and sales summaries. | Summary values are derived from persisted order/payment records and clearly state the included status/date filters. |
| FR-ADM-04 | P1 | Administrators can view AI tool execution audit records. | Audit access is restricted to authorized admins; secrets and unnecessary personal data are redacted. |

### 7.6 AI assistant and agent capabilities

| ID | Priority | Requirement | Acceptance criteria |
|---|---|---|---|
| FR-AI-01 | P1 | A customer can submit a natural-language product discovery request. | The agent extracts constraints and calls a catalogue search tool; every recommended product exists in the tool result. |
| FR-AI-02 | P1 | A customer can compare selected products. | Comparison fields come from stored product attributes; missing values are labelled unknown/not provided rather than guessed. |
| FR-AI-03 | P1 | A customer can ask about their orders. | Order lookup uses the authenticated principal and returns only that customer's permitted order information. |
| FR-AI-04 | P1 | The assistant can help prepare a return request. | The backend checks eligibility; the user sees the request details and explicitly confirms before a mutation is submitted. |
| FR-AI-05 | P1 | AI tool calls are auditable. | Each execution stores actor, conversation, tool name, time, outcome, and safely redacted argument/result metadata. |
| FR-AI-06 | P1 | AI failure does not disable core shopping functionality. | If the model/provider times out or is unavailable, the UI shows a recoverable error and ordinary catalogue/cart/checkout features continue to work. |
| FR-AI-07 | P1 | AI tools enforce permissions and business rules independently of the model. | Tools reject unauthorized actions even if prompted by the model; the model cannot provide or override the authenticated customer identity. |
| FR-AI-08 | P1 | Mutating AI-assisted actions require clear user confirmation. | Cart mutations, return requests, and other state changes are summarized before execution; orders, cancellations, and refunds are not autonomously submitted. |
| FR-AI-09 | P2 | Product recommendations can use customer preferences or permitted interaction history. | Recommendations use disclosed, permitted signals and can explain the primary reasons; a customer can still browse without personalization. |

## 8. Business rules and data integrity

These rules are mandatory regardless of whether an action originates from the UI, an API client, an administrator, or an AI agent.

1. **Server is authoritative:** Product price, discount, tax/fee, and stock values used for an order are calculated or retrieved by the backend. Never trust values posted by the browser or generated by an LLM.
2. **Customer ownership:** The authenticated principal determines access to profiles, addresses, carts, conversations, and orders. Never accept a model-supplied `user_id` as proof of ownership.
3. **Atomic checkout:** Order creation, order-item snapshots, payment simulation, and inventory changes must be committed in one database transaction or rolled back together.
4. **Concurrency:** Inventory decrement must use a safe transaction/locking or conditional-update strategy so concurrent checkouts cannot oversell stock.
5. **Money:** Monetary values use a fixed-precision decimal representation in the database and backend. Avoid binary floating-point for currency calculations.
6. **Historical integrity:** Store purchased product name/SKU and unit-price snapshots on each order item.
7. **Status transitions:** Order and return status changes follow explicit state-transition rules and are recorded with actor and timestamp.
8. **AI boundary:** Agents call typed application tools. They do not receive database credentials, execute arbitrary SQL, or bypass service-layer validation.
9. **Privacy:** Do not place passwords, access tokens, payment credentials, or unnecessary personal data in prompts, logs, conversation history, or tool audit payloads.
10. **Simulated payment:** The first release records a mock outcome only and must not claim that real money has moved.

## 9. UX and page requirements

### 9.1 Customer-facing pages

| Page | Required content / behavior |
|---|---|
| Home | Brand navigation, search entry, featured categories/products, clear path to catalogue. |
| Product catalogue | Search, category/attribute filters, sort controls, pagination, loading/empty/error states. |
| Product details | Product images, description, specifications, price, stock state, quantity selector, add-to-cart action. |
| Register / login | Validated forms, useful errors, password visibility option, accessible labels and keyboard operation. |
| Cart | Product lines, quantities, remove action, current prices, subtotal, unavailable-item messaging, checkout entry. |
| Checkout | Address selection, item summary, server-calculated totals, simulated payment choice/result, submit protection. |
| Order confirmation | Order reference, summary, payment simulation status, link to order details. |
| Order history / detail | Customer's orders, status, purchased-item snapshots, timestamps and delivery address summary. |
| Profile / addresses | View and edit permitted profile details and delivery addresses. |
| AI assistant | Conversation panel, suggested prompts, grounded product cards/comparisons, clear confirmation before mutations. |

### 9.2 Administrator pages

| Page | Required content / behavior |
|---|---|
| Admin login / access gate | Administrator-only routes and clear unauthorized handling. |
| Dashboard | Basic order, sales, and low-stock summaries with clear date/status definitions. |
| Products | Searchable list and create/edit/activate/deactivate workflows. |
| Categories | Create/edit/archive category workflows and product association. |
| Inventory | Stock view and reasoned, auditable stock adjustment. |
| Orders | Search/filter orders, inspect details, update allowed statuses. |
| AI audit | Filter tool executions and inspect redacted outcomes. |

### 9.3 Shared UX standards

- Responsive layouts for desktop, tablet, and mobile viewports.
- Loading, success, empty, validation, and failure states for data-driven screens.
- Consistent navigation and clear separation between customer and admin areas.
- Semantic HTML, form labels, keyboard access, visible focus states, and sufficient color contrast.
- Destructive or consequential actions require an explicit confirmation step.

## 10. Non-functional requirements

The following are **initial engineering targets** for local development and pre-release testing. They are targets to measure, not claims about current performance or production SLAs.

| ID | Area | Requirement / initial target |
|---|---|---|
| NFR-SEC-01 | Password security | Store password hashes using a modern password-hashing algorithm with an appropriate work factor; never log raw passwords. |
| NFR-SEC-02 | Authorization | Enforce authentication, role checks, ownership checks, and input validation on the backend for every protected operation. |
| NFR-SEC-03 | Secrets | Keep database credentials, signing keys, and AI provider keys in environment configuration; never commit populated secrets. |
| NFR-SEC-04 | Web security | Apply safe CORS configuration, secure headers where appropriate, output encoding, parameterized database access, and CSRF protections appropriate to the chosen session/token design. |
| NFR-DATA-01 | Consistency | Critical order/inventory updates are transactional; migrations are version-controlled and repeatable. |
| NFR-PERF-01 | API performance | Target p95 below 500 ms for ordinary non-AI catalogue and account API requests under a documented local test load, excluding external services and database cold start. |
| NFR-PERF-02 | Catalogue scalability | Catalogue endpoints are paginated, indexed for common search/filter fields, and reject unbounded result requests. |
| NFR-REL-01 | AI isolation | AI provider outages do not prevent sign-in, catalogue browsing, cart access, or checkout. |
| NFR-REL-02 | Checkout correctness | Duplicate submissions and concurrent inventory updates do not create duplicate orders or negative stock. |
| NFR-MAINT-01 | Code organization | Keep a modular monolith with clear frontend feature boundaries and backend API/service/model/schema boundaries. |
| NFR-TEST-01 | Test coverage | Critical business workflows have automated unit/integration tests; the customer purchase path has an end-to-end test before MVP sign-off. |
| NFR-ACC-01 | Accessibility | Target WCAG 2.2 AA practices for key customer and admin journeys; verify with keyboard and automated/manual checks. |
| NFR-OBS-01 | Diagnostics | The application emits useful structured development logs without exposing credentials or sensitive customer information. Full telemetry is deferred to the DevOps phase. |

## 11. API and integration expectations

The frontend communicates with FastAPI through versioned REST endpoints using JSON. The API is the enforcement boundary for validation, access control, business rules, and persistence.

### 11.1 Initial API resource groups

| Resource group | Expected responsibilities |
|---|---|
| `/api/v1/auth` | Register, login, current user, profile, logout/session behavior. |
| `/api/v1/products` | List/search, product detail, and admin product mutations. |
| `/api/v1/categories` | List categories and admin category mutations. |
| `/api/v1/cart` | Current customer's cart and cart item mutations. |
| `/api/v1/addresses` | Current customer's address management. |
| `/api/v1/checkout` | Order submission and simulated payment outcome. |
| `/api/v1/orders` | Customer order history/details and admin order management. |
| `/api/v1/inventory` | Admin inventory visibility and adjustments. |
| `/api/v1/agents` | AI conversation and tool orchestration endpoints. |

These are logical resource groups. Exact paths, request schemas, and response schemas are finalized during implementation and documented through FastAPI OpenAPI output.

### 11.2 API conventions

- Use Pydantic schemas for request and response validation.
- Return consistent HTTP status codes and safe error payloads.
- Use explicit pagination parameters and metadata for list endpoints.
- Keep API versioning under `/api/v1`.
- Do not expose ORM objects directly as public response contracts.
- Document authentication requirements and role requirements for protected endpoints.

## 12. AI behavior, safety, and quality requirements

AI is an assisting interface over application capabilities. It is not the source of truth and is not an authorization mechanism.

### 12.1 Agent responsibilities

| Agent | Allowed read capabilities | Allowed write capabilities in initial design |
|---|---|---|
| Shopping Agent | Search active catalogue, read product details and availability. | No direct write by default; may request a confirmed cart action through a backend tool. |
| Comparison Agent | Read selected product attributes and catalogue details. | None. |
| Order Support Agent | Read orders and status belonging to the authenticated customer. | Prepare an eligible return request after showing details and receiving confirmation. |
| Recommendation Agent | Read permitted catalogue data and, when enabled, permitted customer preference signals. | None. |

### 12.2 AI safety controls

- The backend derives the user identity from the validated session/token.
- Tool names and schemas are explicit and narrowly scoped; no arbitrary function or SQL execution.
- Backend services re-check all authorization, stock, price, eligibility, and state-transition rules.
- The agent must say when it cannot find a matching product or when data is missing; it must not invent results.
- Product price and stock claims must come from a fresh backend result and include a clear indication that availability can change before checkout.
- The assistant must distinguish an order status recorded by the system from a carrier's live shipment status (which is out of scope initially).
- Tool calls and outcomes are recorded with redaction and retention appropriate to the data.
- Set provider timeouts, bounded tool iterations, request size limits, and per-user usage limits.
- User-facing responses must not reveal prompts, secrets, internal configuration, other customers' data, or hidden admin-only information.
- Prompt injection or malicious content found in product descriptions is treated as untrusted data, never as system/developer instructions.

### 12.3 AI fallback behavior

When the AI provider is unavailable, rate-limited, or returns an invalid response:
- Show a recoverable message in the assistant interface.
- Preserve the user's ability to use ordinary product search, filters, cart, and checkout.
- Do not partially apply a state-changing tool call.
- Record a sanitized failure for diagnostics.

## 13. Product success metrics

Metrics below are intended to assess whether the product works. They are not production business forecasts.

| Metric | Initial success condition |
|---|---|
| Registration and login | A new customer can register, log in, retrieve their profile, and log out successfully. |
| Product discovery | A customer can find a seeded product by browsing and by search/filter criteria. |
| Purchase workflow | A customer can add an available product to cart and complete a successful simulated checkout. |
| Order correctness | Order totals match server-calculated item snapshots and stock remains valid under concurrent test attempts. |
| Ownership isolation | Automated tests prove one customer cannot read another customer's cart, address, conversation, or order. |
| Admin workflow | An administrator can create a product, adjust stock, inspect an order, and update an allowed status. |
| AI grounding | Every product in an AI shopping response maps to a real catalogue result; missing attributes are not fabricated. |
| AI permission safety | Automated tests prove AI tools cannot access another customer's order or perform unconfirmed mutations. |
| AI resilience | Simulated AI provider failure does not break core commerce workflows. |

## 14. Release acceptance criteria

### 14.1 MVP acceptance gate

The MVP can be considered complete when all of the following are true:

- Customer registration, authentication, and role enforcement work end to end.
- Customers can browse and search seeded products and view product details.
- Customers can manage a persistent cart and delivery address.
- Checkout recalculates price and stock on the backend and uses transactional inventory handling.
- A successful simulated payment creates one order with immutable item snapshots.
- Customers can view only their own orders.
- Administrators can manage catalogue data, stock, and order status.
- Critical backend tests and a customer purchase-path test pass.
- Local setup instructions allow a new contributor to run the web app and API against PostgreSQL.
- No real payment or AI feature is represented as implemented unless it is actually integrated and tested.

### 14.2 AI release acceptance gate

- Shopping, comparison, and order support agents use typed, permission-checked tools.
- Product claims are grounded in returned catalogue data.
- Customer order data is strictly scoped to the authenticated customer.
- Mutations require an explicit confirmation and revalidation by backend services.
- Audit records are created with sensitive values redacted.
- AI provider failure does not affect core shopping functions.
- Tests cover prompt injection-like untrusted catalogue content, unauthorized requests, missing data, timeouts, and invalid provider responses.

### 14.3 DevOps phase entry gate

Do not begin major infrastructure work until:
- The application can be run locally from documented steps.
- PostgreSQL migrations and seed process are repeatable.
- The core customer flow is covered by tests.
- Configuration is externalized and secrets are not committed.
- The frontend and backend build/test commands are documented.

## 15. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Scope grows too quickly | Core application remains incomplete. | Finish one vertical slice at a time; defer advanced features to later releases. |
| AI returns fabricated product details | Customer trust and purchase decisions are harmed. | Ground product answers in catalogue tool results and validate all returned product identifiers/attributes. |
| AI accesses another user's data | Serious privacy/security issue. | Derive identity server-side, scope every query, and test cross-user access denial. |
| Race conditions oversell stock | Invalid orders and inconsistent inventory. | Use database transactions and concurrency-safe inventory updates; test parallel checkout. |
| Client manipulates price or quantity | Revenue and data integrity issues. | Recalculate price and validate quantity/availability on the backend at every mutation. |
| Payment simulation is mistaken for a real payment | Misleading product behavior. | Label it prominently as simulated and do not collect payment credentials. |
| External AI provider outage | AI feature unavailable. | Keep AI optional, use timeouts and graceful fallback, and preserve deterministic catalogue workflows. |
| Premature microservices/infrastructure | Increased complexity before product value exists. | Start with a modular monolith and add infrastructure only after application milestones. |

## 16. Assumptions and decisions to confirm

The following defaults are proposed to keep implementation moving. They can be changed before the relevant milestone without changing the product's core architecture.

| Topic | Proposed initial decision | When to revisit |
|---|---|---|
| Initial market/demo data | Seed realistic sample products; show prices in INR for the demo. Currency should be represented explicitly in the data model. | Before supporting multiple currencies or a real launch. |
| Payment | Simulated payment success/failure only. | When selecting and integrating a real payment provider. |
| Delivery | Customer-managed address and admin-updated order status; no live carrier API. | When shipping integration becomes a requirement. |
| Authentication | JWT-based API authentication for the initial implementation; final browser token/session storage design must be security-reviewed. | Before production deployment. |
| Product images | Store image URLs/metadata; use seeded or locally hosted demo assets initially. | Before production-scale image storage/CDN. |
| AI provider | Keep provider integration behind a small adapter so the vendor can be changed. | When selecting the provider and agent framework. |
| Returns | Request and admin review workflow; no automated refund. | When return policies and payment integration are specified. |
| Deployment | Local processes and local PostgreSQL first. | After MVP and test gate. |

## 17. Dependencies

- Python 3.11+ and the chosen supported FastAPI/Pydantic/SQLAlchemy versions.
- Node.js 20+ and npm for the React/Vite application.
- PostgreSQL 15+ for the target relational database.
- A local development environment with Git and environment-variable configuration.
- An LLM provider/API key only for the AI enhancement milestone; core MVP functionality must not require it.

Specific dependency versions belong in the application package/requirements files and should be pinned or constrained and reviewed as part of implementation.

## 18. Glossary

| Term | Meaning |
|---|---|
| PRD | Product Requirements Document: describes the product's users, behavior, scope, and success conditions. |
| MVP | Minimum Viable Product: the smallest complete version that delivers the core customer and admin workflows. |
| Modular monolith | One backend application organized into modules with clear boundaries, rather than separate microservices. |
| RBAC | Role-Based Access Control: permissions granted according to roles such as customer or administrator. |
| Tool call | A structured request from an AI agent to invoke a narrowly defined backend capability. |
| Grounded response | An AI answer based on retrieved application data rather than unsupported model-generated claims. |
| Idempotency | A property that makes repeated submission of the same operation produce one effective result. |
| SLO | Service Level Objective: a measurable reliability target, to be designed during the later SRE phase. |

## 19. Change control

- Update this PRD when product scope, roles, core workflows, or acceptance criteria materially change.
- Keep implementation-specific decisions in `architecture.md` and delivery sequencing in `development-roadmap.md`.
- Link significant requirement changes to an issue, pull request, or decision record when the project begins using them.
- Do not mark a requirement complete because a page or placeholder exists; mark it complete only after the behavior is implemented and verified against its acceptance criteria.

---

**End of document — ShopPilot PRD v1.0**

---

## Implementation baseline (14 November 2026)

The current repository implements the first end-to-end customer transaction slice: registration/login, session-authenticated frontend routes, public catalogue, persistent cart, demo checkout, stock deduction, and customer-owned order history. The administrator can create/update/deactivate products, update inventory, and upload product images through local development storage. A catalogue-grounded rule-based recommendation endpoint is connected to the assistant page.

The following PRD capabilities are not yet complete and must not be treated as shipped: category management, saved addresses, real or simulated payment records, admin order fulfilment/status management, conversational LLM agent orchestration, product-comparison tools, return workflows, AI conversation/tool audit persistence, production rate limiting, and cloud deployment. The AI recommendation implementation is deterministic and does not call an LLM provider. Checkout is a demo order flow and collects no payment.

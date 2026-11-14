# ShopPilot — Product Requirements

## Product vision

Build a realistic e-commerce application that is independently useful as a web product and later serves as the application workload for a Cloud / DevOps / SRE project. AI features should solve concrete shopping and support problems using verified application data.

## User roles

### Customer
- Create an account, authenticate, and manage a profile.
- Browse, search, filter, sort, and inspect products.
- Maintain a persistent cart.
- Check out using a delivery address and simulated payment in the initial release.
- View order history and order status.
- Ask an AI assistant for product discovery, comparisons, and order support.

### Administrator
- Manage products, categories, prices, and inventory.
- View and update customer orders.
- View basic sales and inventory summaries.
- Review AI tool execution audit records where appropriate.

## Functional requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | Customer registration, login, logout, and profile | P0 |
| FR-02 | Role-based authorization for customer and admin | P0 |
| FR-03 | Product listing and product details | P0 |
| FR-04 | Catalogue search, category filter, sort, and pagination | P0 |
| FR-05 | Persistent cart and cart item quantity management | P0 |
| FR-06 | Server-side price and inventory validation | P0 |
| FR-07 | Checkout and order creation with item price snapshots | P0 |
| FR-08 | Customer order history and status | P0 |
| FR-09 | Admin product/category/inventory management | P1 |
| FR-10 | Admin order management | P1 |
| FR-11 | AI shopping assistant grounded in catalogue records | P1 |
| FR-12 | AI product comparison with source attributes | P1 |
| FR-13 | AI order-support agent restricted to the authenticated customer | P1 |
| FR-14 | Return request workflow with explicit customer confirmation | P2 |
| FR-15 | Recommendation personalization | P2 |
| FR-16 | AI tool-call audit trail and basic safety controls | P1 |

## AI agent requirements

1. Agents operate through backend tools/services, not unrestricted SQL access.
2. Every customer-scoped tool derives the user identity from the authenticated session, not from a user ID supplied by the model.
3. Product recommendations must be grounded in current product records. Do not fabricate prices, stock, or specifications.
4. Read-only actions can execute when authorized. Mutating actions such as cart changes, returns, cancellations, or orders require explicit confirmation and normal business validation.
5. Record conversation ID, authenticated actor, tool name, arguments (redacted where sensitive), outcome, and timestamp for auditable tool executions.
6. If an AI provider is unavailable, core shopping and order flows must remain usable.

## Non-functional requirements

- Security: password hashing, JWT validation, RBAC, input validation, safe error responses, and secrets kept outside source control.
- Correctness: monetary values use decimal/numeric types; order totals are calculated on the server; inventory updates are transactional.
- Maintainability: modular monolith, feature-oriented frontend, service-oriented backend, migrations, and API contracts.
- Performance: paginated catalogue API and database indexes on common lookup fields.
- Reliability: AI is an optional enhancement, not a dependency for checkout or account access.
- Testability: unit and integration tests for authentication, catalog, cart, inventory, orders, and agent tools.
- Accessibility: semantic HTML, keyboard navigation, visible focus states, and suitable contrast.

## Out of scope for the first application milestone

- Kubernetes, Terraform, CI/CD, production cloud hosting, and observability stack.
- Real payment gateway integration.
- Microservices and event streaming.
- Autonomous refunds, payments, or order placement by AI.

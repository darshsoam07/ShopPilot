# ShopPilot — Database Model

This document distinguishes tables implemented in the current migrations from target entities planned for later milestones.

## Implemented in migrations 0001–0002

| Table | Important fields | Purpose / constraints |
|---|---|---|
| users | id, full_name, email, password_hash, role, is_active | Unique email; public registration always assigns `customer`; admin role is assigned out of band for now |
| products | id, name, slug, description, sku, price, stock_quantity, image_url, is_active | Unique slug and SKU; non-negative price and stock; Decimal/Numeric prices |
| carts | id, user_id, created_at, updated_at | One persistent cart per user; deleting a user cascades to the cart |
| cart_items | id, cart_id, product_id, quantity | Unique cart/product pair; positive quantity; product cannot be hard-deleted while in a cart |
| orders | id, user_id, status, total_amount, currency, shipping_address, created_at | Server-calculated total; shipping address snapshot stored as JSON for the first release |
| order_items | id, order_id, product_id, product_name, sku, unit_price, quantity, line_total | Purchase-time name, SKU and unit-price snapshots; product reference can become null if product is later removed |

## Planned entities

| Entity | Intended fields | Notes |
|---|---|---|
| addresses | id, user_id, recipient, line1, city, state, postal_code, country | Reusable customer address book; current checkout accepts a one-time address snapshot |
| categories | id, name, slug | Product taxonomy and category filtering |
| product_images | id, product_id, image_url, sort_order | Multiple product images and ordering |
| payments | id, order_id, provider, status, amount, reference | Simulated initially; later payment gateway integration |
| returns | id, order_id, user_id, reason, status | Validate ownership and return eligibility |
| agent_conversations | id, user_id, created_at | Customer-scoped AI conversation history |
| agent_messages | id, conversation_id, role, content, created_at | Avoid storing secrets/payment data |
| agent_tool_executions | id, conversation_id, user_id, tool_name, status, created_at | Redacted arguments/result metadata for auditing |

## Transaction and integrity rules

- Cart quantity must be positive and one cart cannot contain duplicate rows for the same product.
- Checkout re-reads the customer's cart and uses a conditional `UPDATE products SET stock_quantity = stock_quantity - :quantity WHERE stock_quantity >= :quantity` inside the order transaction.
- If any item cannot be fulfilled, the transaction rolls back and no order or partial stock deduction is committed.
- Order totals are calculated by the backend from current product prices, never from browser-supplied amounts.
- Order items copy product name, SKU, unit price, quantity, and line total at purchase time.
- Orders and order lookup queries are scoped to the authenticated user. Admin APIs require the `admin` role.

## Migrations

- `0001_initial_users_products.py`: users and products.
- `0002_cart_orders.py`: carts, cart items, orders, and order items.

Use `alembic upgrade head` to apply migrations. Never use `Base.metadata.create_all()` as a production migration strategy.

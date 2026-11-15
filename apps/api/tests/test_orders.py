from decimal import Decimal

from app.models.product import Product
from app.models.order import Coupon


ADDRESS = {
    "recipient_name": "Test Customer",
    "phone": "+919876543210",
    "address_line1": "18 Market Road",
    "address_line2": None,
    "city": "Meerut",
    "state": "Uttar Pradesh",
    "postal_code": "250001",
    "country": "India",
}


def create_product(db_session, stock: int = 10) -> Product:
    product = Product(
        name="Mechanical Keyboard",
        slug="mechanical-keyboard",
        description="Mechanical keyboard for programming",
        sku="KB-TEST-001",
        price=Decimal("2499.00"),
        stock_quantity=stock,
        image_url=None,
        is_active=True,
    )
    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)
    return product


def test_cart_checkout_deducts_stock_and_creates_order(client, db_session, customer_headers):
    product = create_product(db_session)
    add = client.post("/api/v1/cart/items", headers=customer_headers, json={"product_id": product.id, "quantity": 2})
    assert add.status_code == 200, add.text
    assert add.json()["item_count"] == 2
    assert Decimal(add.json()["subtotal"]) == Decimal("4998.00")

    checkout = client.post("/api/v1/orders/checkout", headers=customer_headers, json={"shipping_address": ADDRESS})
    assert checkout.status_code == 201, checkout.text
    order = checkout.json()
    assert order["status"] == "PAID"
    assert Decimal(order["total_amount"]) == Decimal("4998.00")
    assert order["items"][0]["product_name"] == "Mechanical Keyboard"
    assert order["items"][0]["quantity"] == 2

    db_session.refresh(product)
    assert product.stock_quantity == 8
    cart = client.get("/api/v1/cart", headers=customer_headers)
    assert cart.status_code == 200
    assert cart.json()["items"] == []


def test_checkout_rejects_insufficient_stock_without_partial_order(client, db_session, customer_headers):
    product = create_product(db_session, stock=1)
    add = client.post("/api/v1/cart/items", headers=customer_headers, json={"product_id": product.id, "quantity": 1})
    assert add.status_code == 200

    # Simulate another buyer consuming stock after the item was placed in the cart.
    product.stock_quantity = 0
    db_session.commit()

    checkout = client.post("/api/v1/orders/checkout", headers=customer_headers, json={"shipping_address": ADDRESS})
    assert checkout.status_code == 409
    orders = client.get("/api/v1/orders", headers=customer_headers)
    assert orders.status_code == 200
    assert orders.json()["total"] == 0
    cart = client.get("/api/v1/cart", headers=customer_headers)
    assert len(cart.json()["items"]) == 1


def test_customer_cannot_read_another_customers_order(client, db_session, customer_headers):
    product = create_product(db_session)
    client.post("/api/v1/cart/items", headers=customer_headers, json={"product_id": product.id, "quantity": 1})
    order_response = client.post("/api/v1/orders/checkout", headers=customer_headers, json={"shipping_address": ADDRESS})
    order_id = order_response.json()["id"]

    other = client.post(
        "/api/v1/auth/register",
        json={"full_name": "Other Customer", "email": "other@example.com", "password": "StrongPassword123!"},
    )
    assert other.status_code == 201
    other_login = client.post("/api/v1/auth/login", json={"email": "other@example.com", "password": "StrongPassword123!"})
    other_headers = {"Authorization": f"Bearer {other_login.json()['access_token']}"}

    response = client.get(f"/api/v1/orders/{order_id}", headers=other_headers)
    assert response.status_code == 404
    assert client.post(f"/api/v1/orders/{order_id}/advance-status", headers=other_headers).status_code == 404


def test_coupon_checkout_rollback_and_fulfillment(client, db_session, customer_headers):
    product = create_product(db_session)
    db_session.add(Coupon(code="AI20", discount_percent=20, max_discount_amount=100, min_order_amount=100))
    db_session.commit()
    client.post("/api/v1/cart/items", headers=customer_headers, json={"product_id": product.id, "quantity": 1})
    orders = "/api/v1/orders"
    quote = client.post(orders + "/validate-coupon", headers=customer_headers, json={"code": "ai20", "subtotal": 99})
    assert not quote.json()["valid"]
    body = {"shipping": {"full_name": "Test Buyer", "address": "12 Market Street", "city": "Meerut", "postal_code": "250001"},
            "coupon_code": "INVALID", "payment_method": "cod"}
    assert client.post(orders + "/checkout", headers=customer_headers, json=body).status_code == 400
    db_session.refresh(product)
    assert product.stock_quantity == 10
    body["coupon_code"] = "ai20"
    result = client.post(orders + "/checkout", headers=customer_headers, json=body)
    assert result.status_code == 201, result.text
    order = result.json()
    assert order["status"] == "PROCESSING" and order["receipt_number"].startswith("SP-")
    assert Decimal(order["total_amount"]) == Decimal("2399") and order["coupon_code"] == "AI20"
    for expected in ["SHIPPED", "DELIVERED", "DELIVERED"]:
        assert client.post(f"{orders}/{order['id']}/advance-status", headers=customer_headers).json()["status"] == expected


def test_decline_then_retry_with_shipping(client, db_session, customer_headers):
    product = create_product(db_session, stock=1)
    client.post("/api/v1/cart/items", headers=customer_headers, json={"product_id": product.id, "quantity": 1})
    payload = {"shipping_address": ADDRESS, "carrier": "FedEx", "simulate_failure": True}
    assert client.post("/api/v1/orders/checkout", headers=customer_headers, json=payload).status_code == 402
    db_session.refresh(product)
    assert product.stock_quantity == 1
    assert client.get("/api/v1/cart", headers=customer_headers).json()["item_count"] == 1
    payload["simulate_failure"] = False
    order = client.post("/api/v1/orders/checkout", headers=customer_headers, json=payload).json()
    assert Decimal(order["total_amount"]) == product.price + Decimal("9.99")

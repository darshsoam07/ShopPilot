from app.models.order import Order, OrderItem
from app.models.product import Product


def test_unpurchased_user_cannot_submit_review(client, db_session, customer_headers):
    product = Product(
        name="Acoustic Reference Headphones - Silver",
        description="Open-back studio headphones",
        price=299.0,
        slug="headphones", sku="AUD-TEST", stock_quantity=5,
    )
    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)

    res = client.post(
        f"/api/v1/products/{product.id}/reviews",
        headers=customer_headers,
        json={
            "rating": 5,
            "title": "Great soundstage",
            "comment": "Tried these at a friend's studio and loved them.",
        },
    )
    assert res.status_code == 403


def test_verified_buyer_submits_review_and_updates_ai_digest(
    client, db_session, customer_headers
):
    product = Product(
        name="Voyager ANC Headphones - Obsidian Pro",
        description="Noise-cancelling wireless headphones",
        price=249.0,
        slug="headphones", sku="AUD-TEST", stock_quantity=12,
    )
    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)

    # Record a paid order for test_user
    order = Order(
        user_id=client.get("/api/v1/auth/me", headers=customer_headers).json()["id"], shipping_address={},
        status="PAID",
        total_amount=249.0,
        items=[OrderItem(product_id=product.id, quantity=1, unit_price=249.0, product_name=product.name, sku=product.sku, line_total=249.0)],
    )
    db_session.add(order)
    db_session.commit()

    post_res = client.post(
        f"/api/v1/products/{product.id}/reviews",
        headers=customer_headers,
        json={
            "rating": 5,
            "title": "Incredible ANC and battery life",
            "comment": "The sound clarity is crisp and battery easily lasts 30 hours.",
        },
    )
    assert post_res.status_code == 201
    created = post_res.json()
    assert created["is_verified_purchase"] is True

    get_res = client.get(
        f"/api/v1/products/{product.id}/reviews",
        headers=customer_headers,
    )
    assert get_res.status_code == 200
    bundle = get_res.json()
    assert bundle["can_review"] is True
    assert bundle["digest"]["total_reviews"] == 1
    assert bundle["digest"]["verified_count"] == 1
    assert bundle["digest"]["average_rating"] == 5.0
    assert "Sound & Audio Clarity" in bundle["digest"]["pros"]

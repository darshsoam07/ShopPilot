from decimal import Decimal

from app.models.product import Product


def add_product(db_session, *, name: str, slug: str, sku: str, active: bool = True) -> Product:
    product = Product(
        name=name,
        slug=slug,
        description=f"Description for {name}",
        sku=sku,
        price=Decimal("100.00"),
        stock_quantity=3,
        is_active=active,
    )
    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)
    return product


def test_public_catalogue_search_returns_matching_active_products(client, db_session):
    matching = add_product(db_session, name="Studio Headphones", slug="studio-headphones", sku="AUD-STUDIO")
    add_product(db_session, name="Fitness Watch", slug="fitness-watch", sku="WAT-FITNESS", active=False)

    response = client.get("/api/v1/products?q=headphones")
    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["id"] == matching.id


def test_cart_item_can_be_updated_and_removed(client, db_session, customer_headers):
    product = add_product(db_session, name="Desk Lamp", slug="desk-lamp", sku="HOME-LAMP")
    added = client.post("/api/v1/cart/items", headers=customer_headers, json={"product_id": product.id, "quantity": 2})
    item_id = added.json()["items"][0]["id"]

    updated = client.patch(f"/api/v1/cart/items/{item_id}", headers=customer_headers, json={"quantity": 1})
    assert updated.status_code == 200
    assert updated.json()["item_count"] == 1

    removed = client.delete(f"/api/v1/cart/items/{item_id}", headers=customer_headers)
    assert removed.status_code == 200
    empty = client.get("/api/v1/cart", headers=customer_headers)
    assert empty.json()["items"] == []

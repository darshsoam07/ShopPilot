from decimal import Decimal

from app.models.product import Product


def test_assistant_recommendations_are_catalogue_grounded(client, db_session):
    product = Product(
        name="Python Programming Laptop",
        slug="python-programming-laptop",
        description="Laptop with 16 GB RAM for software development",
        sku="LAP-TEST-001",
        price=Decimal("55000.00"),
        stock_quantity=4,
        is_active=True,
    )
    db_session.add(product)
    db_session.commit()

    response = client.post(
        "/api/v1/assistant/recommendations",
        json={"query": "laptop for Python under 60000", "limit": 5},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["agent"] == "catalog-rule-based-v1"
    assert payload["total"] == 1
    assert payload["items"][0]["id"] == product.id

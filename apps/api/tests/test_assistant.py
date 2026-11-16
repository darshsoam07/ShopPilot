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


def test_contextual_comparison_and_cart_permissions(client, db_session, customer_headers):
    for name in ["Lamp", "Lantern"]:
        db_session.add(Product(name=name, slug=name.lower(), sku=name.upper(), description=name,
                               price=Decimal("99"), stock_quantity=2, is_active=True))
    db_session.commit()
    path = "/api/v1/assistant/chat"
    body = {"message": "Compare this item", "context": {"active_product_id": 1}}
    result = client.post(path, json=body)
    assert result.status_code == 200
    assert result.json()["action"]["tool_name"] == "product_qa"
    assert [p["name"] for p in result.json()["recommended_products"]] == ["Lamp", "Lantern"]
    body["message"] = "Add this to my cart"
    assert client.post(path, json=body).json()["action"]["status"] == "requires_auth"
    assert client.get("/api/v1/cart", headers=customer_headers).json()["item_count"] == 0
    assert client.post(path, headers=customer_headers, json=body).json()["action"]["status"] == "executed"
    assert client.get("/api/v1/cart", headers=customer_headers).json()["item_count"] == 1


def test_variant_resolution_and_history(client, db_session, customer_headers):
    for suffix, plan in [("STD", "None"), ("CARE2", "2 years")]:
        db_session.add(Product(name="Nova " + suffix, slug=suffix.lower(), sku=suffix, price=99,
                               family="nova", stock_quantity=3, specifications={"Finish": "Obsidian",
                               "Configuration": "Standard", "Protection": plan}))
    db_session.commit()
    def ask(message):
        result = client.post("/api/v1/assistant/chat", headers=customer_headers,
                             json={"message": message, "context": {"active_product_id": 1}})
        assert result.status_code == 200, result.text
        return result.json()
    assert len(ask("Compare the standard vs pro bundle")["action"]["payload"]["rows"]) == 2
    assert ask("Add the Matte Black finish to my cart")["action"]["status"] == "skipped"
    result = ask("Add the Matte Black finish with 2-year protection to my cart")
    assert result["action"]["payload"]["product_id"] == 2
    assert client.get("/api/v1/cart", headers=customer_headers).json()["item_count"] == 1
    history = client.get("/api/v1/assistant/history", headers=customer_headers).json()
    assert history[-1]["recommended_products"][0]["sku"] == "CARE2"
    assert client.get("/api/v1/assistant/history").status_code == 401

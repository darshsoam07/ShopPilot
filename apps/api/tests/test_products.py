from decimal import Decimal

import pytest
from sqlalchemy import event, select
from sqlalchemy.orm import sessionmaker

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


def test_catalogue_price_range_stock_and_sort(client, db_session):
    for name, price, stock in [("High", 150, 1), ("Low", 20, 2), ("Unavailable", 60, 0), ("Premium", 300, 4)]:
        product = add_product(db_session, name=name, slug=name.lower(), sku="DESK-" + name)
        product.price, product.stock_quantity = price, stock
    db_session.commit()
    result = client.get("/api/v1/products?min_price=10&max_price=200&in_stock=true&sort=price_asc&category=desk")
    assert result.status_code == 200
    assert result.json()["total"] == 2
    assert [item["name"] for item in result.json()["items"]] == ["Low", "High"]


def test_catalog_facets_precede_pagination_and_exclude_hidden(client, db_session):
    for name, category in [("Phone", "Mobile"), ("Tablet", "Mobile"), ("Lamp", "Lighting"), ("Hidden", "Lighting")]:
        item = add_product(db_session, name=name, slug=name.lower(), sku=name, active=name != "Hidden")
        item.category = category
    db_session.commit()
    data = client.get("/api/v1/products/catalog?categories=Mobile&page=2&page_size=1").json()
    assert data["total"] == 2 and len(data["items"]) == 1
    assert data["categories"] == {"Mobile": 2, "Lighting": 1}


def test_nova_seed_media_matches_finish():
    from scripts.seed_products import SAMPLE_PRODUCTS

    by_sku = {item["sku"]: item for item in SAMPLE_PRODUCTS}
    assert by_sku["AUD-NOVA-001"]["image_url"] == "/demo/nova.jpg"
    assert by_sku["AUD-NOVA-001"]["gallery_images"] == [
        f"/demo/nova-detail-{i}.jpg" for i in range(1, 5)
    ]
    assert by_sku["AUD-NOVA-ALB"]["image_url"] is None
    assert by_sku["AUD-NOVA-ALB"]["gallery_images"] == []


LEGACY_PHOTO = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900"
DEMO_GALLERY = [f"/demo/nova-detail-{i}.jpg" for i in range(1, 5)]
UPLOAD = "/media/alabaster.webp"
OTHER_SIZE = LEGACY_PHOTO.replace("900", "1200")


@pytest.mark.parametrize(("family", "finish", "primary", "gallery", "expected_primary", "expected_gallery"), [
    ("nova", "Alabaster", "/demo/nova.jpg", DEMO_GALLERY, None, []),
    (None, None, LEGACY_PHOTO, [], None, []),
    ("nova", "Alabaster", UPLOAD, [DEMO_GALLERY[0], UPLOAD, LEGACY_PHOTO, OTHER_SIZE], UPLOAD, [UPLOAD, OTHER_SIZE]),
    ("nova", "Alabaster", UPLOAD, [UPLOAD], UPLOAD, [UPLOAD]),
    ("other", "Alabaster", LEGACY_PHOTO, [], LEGACY_PHOTO, []),
    ("nova", "Obsidian", "/demo/nova.jpg", DEMO_GALLERY, "/demo/nova.jpg", DEMO_GALLERY),
])
def test_reseed_existing_alabaster(engine, db_session, monkeypatch, family, finish, primary, gallery,
                                   expected_primary, expected_gallery):
    from scripts import seed_products

    monkeypatch.setattr(seed_products, "SessionLocal", sessionmaker(bind=engine))
    seed_products.main()
    alabaster = db_session.scalar(select(Product).where(Product.sku == "AUD-NOVA-ALB"))
    alabaster.family = family
    alabaster.specifications = {"Finish": finish} if finish else {}
    alabaster.image_url, alabaster.gallery_images = primary, gallery
    unrelated = add_product(db_session, name="Other", slug="other", sku="OTHER")
    unrelated.image_url = "/demo/nova-detail-5.jpg"
    unrelated.gallery_images = [LEGACY_PHOTO]
    db_session.commit()

    seed_products.main()
    db_session.expire_all()
    assert (alabaster.image_url, alabaster.gallery_images) == (expected_primary, expected_gallery)
    assert (unrelated.image_url, unrelated.gallery_images) == ("/demo/nova-detail-5.jpg", [LEGACY_PHOTO])
    obsidian = db_session.scalar(select(Product).where(Product.sku == "AUD-NOVA-001"))
    assert (obsidian.image_url, obsidian.gallery_images) == ("/demo/nova.jpg", DEMO_GALLERY)

    writes = []
    @event.listens_for(engine, "before_cursor_execute")
    def record_writes(conn, cursor, statement, parameters, context, executemany):
        if context.isupdate or context.isinsert or context.isdelete:
            writes.append(statement)

    seed_products.main()
    assert writes == []

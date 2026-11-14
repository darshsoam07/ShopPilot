from decimal import Decimal

from sqlalchemy import select

from app.core.config import settings
from app.models.user import User


def promote_customer_to_admin(db_session):
    user = db_session.scalar(select(User).where(User.email == "customer@example.com"))
    user.role = "admin"
    db_session.commit()


def test_admin_can_create_and_update_product(client, db_session, customer_headers):
    promote_customer_to_admin(db_session)
    created = client.post(
        "/api/v1/admin/products",
        headers=customer_headers,
        json={
            "name": "Admin Created Laptop",
            "slug": "admin-created-laptop",
            "description": "Test product",
            "sku": "ADMIN-LAP-001",
            "price": "45000.00",
            "stock_quantity": 5,
            "is_active": True,
        },
    )
    assert created.status_code == 201, created.text
    product_id = created.json()["id"]
    assert Decimal(created.json()["price"]) == Decimal("45000.00")

    updated = client.patch(
        f"/api/v1/admin/products/{product_id}",
        headers=customer_headers,
        json={"stock_quantity": 8, "price": "43999.00"},
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["stock_quantity"] == 8
    assert Decimal(updated.json()["price"]) == Decimal("43999.00")


def test_admin_image_upload_uses_local_storage_adapter(client, db_session, customer_headers, tmp_path, monkeypatch):
    promote_customer_to_admin(db_session)
    monkeypatch.setattr(settings, "MEDIA_DIR", str(tmp_path))
    created = client.post(
        "/api/v1/admin/products",
        headers=customer_headers,
        json={"name": "Image Test Product", "slug": "image-test-product", "description": "", "sku": "IMG-TEST-1", "price": "10.00", "stock_quantity": 1},
    )
    product_id = created.json()["id"]
    response = client.post(
        f"/api/v1/admin/products/{product_id}/image",
        headers=customer_headers,
        files={"image": ("tiny.png", b"\x89PNG\r\n\x1a\nfake image bytes", "image/png")},
    )
    assert response.status_code == 200, response.text
    assert response.json()["image_url"].startswith("/media/")
    assert len(list(tmp_path.iterdir())) == 1

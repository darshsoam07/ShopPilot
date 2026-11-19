from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from threading import Barrier

import pytest
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.after_sales import Refund
from app.models.order import Order
from app.services.after_sales import decide
from test_admin import promote_customer_to_admin
from test_orders import ADDRESS, create_product


@pytest.fixture
def purchase(client, db_session, customer_headers):
    def make(method="card"):
        product = create_product(db_session)
        assert client.post("/api/v1/cart/items", headers=customer_headers,
                           json={"product_id": product.id, "quantity": 2}).is_success
        result = client.post("/api/v1/orders/checkout", headers=customer_headers,
                             json={"shipping_address": ADDRESS, "carrier": "DHL", "payment_method": method})
        assert result.is_success, result.text
        return product, result.json()["id"]
    return make


@pytest.mark.parametrize("kind,method", [("cancellation","card"), ("return","upi"), ("return","cod")])
def test_lifecycle(client, db_session, customer_headers, purchase, kind, method):
    product, oid = purchase(method)
    def request():
        return client.post(f"/api/v1/orders/{oid}/after-sales", headers=customer_headers,
                           json={"reason": "Wrong size", "kind": kind})
    def fulfill(status):
        return client.patch(f"/api/v1/admin/orders/{oid}/status", headers=customer_headers, json={"status":status})
    def decision(rid, status):
        return client.patch(f"/api/v1/admin/after-sales/{rid}", headers=customer_headers, json={"status":status})
    assert client.get("/api/v1/admin/after-sales", headers=customer_headers).status_code == 403
    promote_customer_to_admin(db_session)
    if kind == "return":
        assert request().status_code == 409
        if method != "cod":
            assert fulfill("PROCESSING").is_success
        for stage in ("SHIPPED", "DELIVERED"):
            assert fulfill(stage).is_success
        db_session.expire_all()
        order = db_session.get(Order, oid)
        assert order.delivered_at
        order.delivered_at = datetime.now(timezone.utc) - timedelta(days=8)
        db_session.commit()
        assert request().status_code == 409
        order.delivered_at = datetime.now(timezone.utc) - timedelta(days=7)
        db_session.commit()
    first = request()
    assert first.status_code == 201, first.text
    assert request().status_code == 409
    if kind == "cancellation":
        assert fulfill("PROCESSING").status_code == 409
    assert decision(first.json()["id"], "REJECTED").is_success
    db_session.refresh(product)
    assert product.stock_quantity == 8
    rid = request().json()["id"]
    approved = decision(rid, "APPROVED")
    assert approved.is_success
    if kind == "return":
        assert not approved.json()["refund"]
        db_session.refresh(product)
        assert product.stock_quantity == 8
        result = decision(rid, "RECEIVED")
        assert result.is_success
        assert decision(rid, "RECEIVED").status_code == 409
        assert decision(rid, "COMPLETED").is_success
    else:
        result = approved
        assert decision(rid, "APPROVED").status_code == 409
        db_session.expire_all()
        assert db_session.get(Order, oid).status == "CANCELLED"
    db_session.refresh(product)
    assert product.stock_quantity == 10
    refund = result.json()["refund"]
    if method == "cod":
        assert refund is None
    else:
        assert refund["provider"] == "simulated"
        assert Decimal(refund["amount"]) == Decimal("4998" if kind == "return" else "5013.99")
    assert len(client.get("/api/v1/after-sales", headers=customer_headers).json()) == 2


def test_ownership_and_capture_cap(client, db_session, customer_headers, purchase):
    _, oid = purchase()
    credentials = {"email":"other@example.com", "password":"OtherStrong123!", "full_name":"Other Buyer"}
    assert client.post("/api/v1/auth/register", json=credentials).is_success
    token = client.post("/api/v1/auth/login", json=credentials).json()["access_token"]
    other = {"Authorization": "Bearer " + token}
    url = f"/api/v1/orders/{oid}/after-sales"
    payload = {"kind":"cancellation", "reason":"Changed mind"}
    assert client.post(url, headers=other, json=payload).status_code == 404
    order = db_session.get(Order, oid)
    order.payment.amount = Decimal("10.50")
    db_session.commit()
    rid = client.post(url, headers=customer_headers, json=payload).json()["id"]
    assert client.get("/api/v1/after-sales", headers=other).json() == []
    promote_customer_to_admin(db_session)
    result = client.patch(f"/api/v1/admin/after-sales/{rid}", headers=customer_headers, json={"status":"APPROVED"})
    assert Decimal(result.json()["refund"]["amount"]) == Decimal("10.50")


def test_concurrent_decisions(engine, client, customer_headers, db_session, purchase):
    if engine.dialect.name != "postgresql":
        pytest.skip("Requires independent PostgreSQL transactions")
    product, oid = purchase()
    rid = client.post(f"/api/v1/orders/{oid}/after-sales", headers=customer_headers,
                      json={"kind":"cancellation", "reason":"Duplicate purchase"}).json()["id"]
    gate = Barrier(2)
    def approve(_):
        with Session(engine) as session:
            gate.wait(timeout=15)
            try:
                decide(session, rid, "APPROVED")
                return 200
            except HTTPException as exc:
                return exc.status_code
    with ThreadPoolExecutor(2) as pool:
        assert sorted(pool.map(approve, range(2))) == [200, 409]
    db_session.refresh(product)
    assert product.stock_quantity == 10
    assert db_session.scalar(select(func.count()).select_from(Refund)) == 1

def test_migration_round_trip(engine, tmp_path):
    import os
    import subprocess
    import sys
    from sqlalchemy import create_engine, inspect

    url = (engine.url.render_as_string(hide_password=False) if engine.dialect.name == "postgresql"
           else "sqlite:///" + (tmp_path / "migration.db").as_posix())
    env = {**os.environ, "DATABASE_URL": url}
    verified = create_engine(url)
    try:
        for command, revision, present in (("upgrade", "head", True), ("downgrade", "-1", False),
                                           ("upgrade", "head", True)):
            subprocess.run([sys.executable, "-m", "alembic", command, revision], env=env, check=True)
            schema = inspect(verified)
            assert schema.has_table("refunds") == present
            assert schema.has_table("service_requests") == present
            assert ("delivered_at" in {col["name"] for col in schema.get_columns("orders")}) == present
    finally:
        verified.dispose()

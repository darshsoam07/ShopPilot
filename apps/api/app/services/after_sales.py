from datetime import datetime, timezone, timedelta
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError

from app.core.config import settings
from app.models.after_sales import ServiceRequest, Refund
from app.models.order import Order
from app.models.product import Product


def eligible_kind(order):
    if order.status in ("PAID", "PROCESSING"):
        return "cancellation"
    if order.status == "DELIVERED" and order.delivered_at:
        delivered = order.delivered_at
        day = delivered.replace(tzinfo=delivered.tzinfo or timezone.utc).astimezone(timezone.utc).date()
        if day <= datetime.now(timezone.utc).date() <= day + timedelta(days=settings.RETURN_WINDOW_DAYS):
            return "return"
    return None


def lock_order(db, order_id, user_id=None):
    query = select(Order).where(Order.id == order_id)
    if user_id is not None:
        query = query.where(Order.user_id == user_id)
    order = db.scalar(query.with_for_update().execution_options(populate_existing=True))
    if order is None:
        raise HTTPException(404, "Order not found")
    return order


def create(db, order_id, user_id, kind, reason):
    order = lock_order(db, order_id, user_id)
    if eligible_kind(order) != kind:
        raise HTTPException(409, "Order is ineligible")
    request = ServiceRequest(order_id=order_id, user_id=user_id, kind=kind, reason=reason)
    db.add(request)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Order already has a request")
    return request


def settle(db, request, order):
    for item in sorted(order.items, key=lambda i: i.product_id or 0):
        result = db.execute(update(Product).where(Product.id == item.product_id)
                            .values(stock_quantity=Product.stock_quantity + item.quantity))
        if result.rowcount != 1:
            raise HTTPException(409, "Purchased SKU unavailable for restocking")
    payment = order.payment
    if not payment or payment.status != "succeeded" or payment.payment_method not in ("card", "upi"):
        return
    eligible = order.total_amount - (order.shipping_cost if request.kind == "return" else 0)
    amount = min(eligible, payment.amount)
    if amount > 0:
        db.add(Refund(request_id=request.id, order_id=order.id, payment_id=payment.id,
                      amount=amount, currency=payment.currency, reason=request.reason,
                      reference=f"SIM-{uuid4().hex}"))


def decide(db, request_id, target):
    order_id = db.scalar(select(ServiceRequest.order_id).where(ServiceRequest.id == request_id))
    order = lock_order(db, order_id)
    request = db.get(ServiceRequest, request_id, populate_existing=True)
    transitions = {"REQUESTED": ("APPROVED", "REJECTED")}
    if request.kind == "return":
        transitions.update(APPROVED=("RECEIVED",), RECEIVED=("COMPLETED",))
    if target not in transitions.get(request.status, ()):
        raise HTTPException(409, "Invalid request transition")
    claimed = db.execute(update(ServiceRequest).where(ServiceRequest.id == request_id,
                         ServiceRequest.status == request.status).values(status=target))
    if claimed.rowcount != 1:
        raise HTTPException(409, "Request already processed")
    now = datetime.now(timezone.utc)
    if target in ("APPROVED", "REJECTED"):
        request.decided_at = now
    if request.kind == "cancellation" and target == "APPROVED":
        if eligible_kind(order) != "cancellation":
            raise HTTPException(409, "Order cannot be cancelled")
        settle(db, request, order)
        order.status = "CANCELLED"
        request.completed_at = now
    if target == "RECEIVED":
        settle(db, request, order)
        request.received_at = now
    if target == "COMPLETED":
        request.completed_at = now
    db.commit()
    return request

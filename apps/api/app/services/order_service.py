from uuid import uuid4
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session, selectinload

from app.models.cart import Cart, CartItem
from app.models.order import Coupon, Order, OrderItem
from app.schemas.order import CouponValidateResponse
from app.models.product import Product


def validate_coupon(db: Session, code: str, subtotal: Decimal) -> CouponValidateResponse:
    code = code.strip().upper()
    coupon = db.scalar(select(Coupon).where(Coupon.code == code, Coupon.is_active.is_(True)))
    if coupon is None or subtotal < coupon.min_order_amount:
        message = "Invalid promo code." if coupon is None else f"Minimum subtotal is ₹{coupon.min_order_amount}."
        return CouponValidateResponse(valid=False, code=code, final_total=subtotal, message=message)
    discount = (subtotal * coupon.discount_percent / 100).quantize(Decimal("0.01"))
    if coupon.max_discount_amount is not None:
        discount = min(discount, coupon.max_discount_amount)
    discount = min(subtotal, discount)
    return CouponValidateResponse(valid=True, code=code, discount_percent=coupon.discount_percent,
                                  discount_amount=discount, final_total=subtotal-discount, message=f"Saved ₹{discount}.")


def checkout(db: Session, user_id: int, shipping_address: dict, payment_method="card", coupon_code=None, carrier=None) -> Order:
    """Create an order and deduct inventory atomically.

    The conditional UPDATE is the final oversell guard; it works even on databases
    where SELECT FOR UPDATE is ignored (for example SQLite tests).
    """
    try:
        cart = db.scalar(
            select(Cart)
            .options(selectinload(Cart.items))
            .where(Cart.user_id == user_id)
            .with_for_update()
        )
        if cart is None or not cart.items:
            raise HTTPException(status_code=400, detail="Your cart is empty")

        order = Order(user_id=user_id, status="PROCESSING" if payment_method == "cod" else "PAID",
                      payment_method=payment_method, receipt_number=f"SP-{uuid4().hex.upper()}", total_amount=Decimal("0.00"), currency="INR", shipping_address=shipping_address)
        db.add(order)
        db.flush()

        total = Decimal("0.00")
        for cart_item in sorted(cart.items, key=lambda item: item.product_id):
            product = db.scalar(select(Product).where(Product.id == cart_item.product_id).with_for_update()
                                .execution_options(populate_existing=True))
            if product is None or not product.is_active:
                raise HTTPException(status_code=409, detail="A product in your cart is no longer available")

            quantity = cart_item.quantity
            unit_price = product.price
            line_total = unit_price * quantity

            inventory_update = db.execute(
                update(Product)
                .where(
                    Product.id == product.id,
                    Product.is_active.is_(True),
                    Product.stock_quantity >= quantity,
                )
                .values(stock_quantity=Product.stock_quantity - quantity)
            )
            if inventory_update.rowcount != 1:
                raise HTTPException(status_code=409, detail=f"Insufficient stock for {product.name}")

            db.add(
                OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    product_name=product.name,
                    sku=product.sku,
                    unit_price=unit_price,
                    quantity=quantity,
                    line_total=line_total,
                )
            )
            total += line_total

        order.subtotal_amount = total
        order.total_amount = total
        if coupon_code:
            quote = validate_coupon(db, coupon_code, total)
            if not quote.valid:
                raise HTTPException(status_code=400, detail=quote.message)
            order.coupon_code = quote.code
            order.discount_amount = quote.discount_amount
            order.total_amount = quote.final_total
        fees = {"DHL": Decimal("15.99"), "FedEx": Decimal("9.99"), "GLS": Decimal("7.99")}
        order.shipping_cost = fees[carrier] if carrier else Decimal("0.00")
        order.total_amount += order.shipping_cost
        db.execute(delete(CartItem).where(CartItem.cart_id == cart.id))
        db.commit()
        db.refresh(order)
        return order
    except Exception:
        db.rollback()
        raise


def list_orders(db: Session, user_id: int) -> list[Order]:
    return list(
        db.scalars(
            select(Order)
            .options(selectinload(Order.items))
            .where(Order.user_id == user_id)
            .order_by(Order.created_at.desc(), Order.id.desc())
        ).all()
    )


def get_order(db: Session, user_id: int, order_id: int) -> Order:
    order = db.scalar(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id, Order.user_id == user_id)
    )
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


def advance_status(db: Session, user_id: int, order_id: int) -> Order:
    order = db.scalar(select(Order).where(Order.id == order_id, Order.user_id == user_id).with_for_update())
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    stages = {"placed": "PROCESSING", "PAID": "PROCESSING", "PROCESSING": "SHIPPED", "SHIPPED": "DELIVERED"}
    if order.status in stages:
        order.status = stages[order.status]
    db.commit()
    return order

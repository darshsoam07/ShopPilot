from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session, selectinload

from app.models.cart import Cart, CartItem
from app.models.order import Order, OrderItem
from app.models.product import Product


def checkout(db: Session, user_id: int, shipping_address: dict) -> Order:
    """Create an order and deduct inventory atomically.

    The conditional UPDATE is the final oversell guard; it works even on databases
    where SELECT FOR UPDATE is ignored (for example SQLite tests).
    """
    try:
        cart = db.scalar(
            select(Cart)
            .options(selectinload(Cart.items).selectinload(CartItem.product))
            .where(Cart.user_id == user_id)
            .with_for_update()
        )
        if cart is None or not cart.items:
            raise HTTPException(status_code=400, detail="Your cart is empty")

        order = Order(user_id=user_id, status="placed", total_amount=Decimal("0.00"), currency="INR", shipping_address=shipping_address)
        db.add(order)
        db.flush()

        total = Decimal("0.00")
        for cart_item in cart.items:
            product = cart_item.product
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

        order.total_amount = total
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

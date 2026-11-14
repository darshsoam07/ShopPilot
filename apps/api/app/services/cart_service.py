from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.cart import Cart, CartItem
from app.models.product import Product


def get_or_create_cart(db: Session, user_id: int) -> Cart:
    cart = db.scalar(select(Cart).options(selectinload(Cart.items)).where(Cart.user_id == user_id))
    if cart is None:
        cart = Cart(user_id=user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart


def add_item(db: Session, user_id: int, product_id: int, quantity: int) -> Cart:
    product = db.scalar(select(Product).where(Product.id == product_id, Product.is_active.is_(True)))
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    get_or_create_cart(db, user_id)
    cart = db.scalar(select(Cart).where(Cart.user_id == user_id).with_for_update())
    item = db.scalar(select(CartItem).where(CartItem.cart_id == cart.id, CartItem.product_id == product_id))
    new_quantity = quantity + (item.quantity if item else 0)
    if new_quantity > product.stock_quantity:
        raise HTTPException(status_code=409, detail=f"Only {product.stock_quantity} unit(s) are currently available")

    if item:
        item.quantity = new_quantity
    else:
        db.add(CartItem(cart_id=cart.id, product_id=product_id, quantity=quantity))
    cart.updated_at = datetime.now(timezone.utc)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    return get_or_create_cart(db, user_id)


def update_item(db: Session, user_id: int, item_id: int, quantity: int) -> Cart:
    get_or_create_cart(db, user_id)
    cart = db.scalar(select(Cart).where(Cart.user_id == user_id).with_for_update())
    item = db.scalar(
        select(CartItem).where(CartItem.id == item_id, CartItem.cart_id == cart.id)
    )
    if item is None:
        raise HTTPException(status_code=404, detail="Cart item not found")
    product = db.get(Product, item.product_id)
    if product is None or not product.is_active:
        raise HTTPException(status_code=409, detail="This product is no longer available")
    if quantity > product.stock_quantity:
        raise HTTPException(status_code=409, detail=f"Only {product.stock_quantity} unit(s) are currently available")
    item.quantity = quantity
    cart.updated_at = datetime.now(timezone.utc)
    db.commit()
    return get_or_create_cart(db, user_id)


def remove_item(db: Session, user_id: int, item_id: int) -> None:
    get_or_create_cart(db, user_id)
    cart = db.scalar(select(Cart).where(Cart.user_id == user_id).with_for_update())
    item = db.scalar(select(CartItem).where(CartItem.id == item_id, CartItem.cart_id == cart.id))
    if item is None:
        raise HTTPException(status_code=404, detail="Cart item not found")
    db.delete(item)
    cart.updated_at = datetime.now(timezone.utc)
    db.commit()


def serialize_cart(cart: Cart) -> dict:
    items = []
    subtotal = Decimal("0.00")
    item_count = 0
    for item in cart.items:
        product = item.product
        line_total = product.price * item.quantity
        subtotal += line_total
        item_count += item.quantity
        items.append({"id": item.id, "product_id": item.product_id, "quantity": item.quantity, "product": product})
    return {"id": cart.id, "items": items, "item_count": item_count, "subtotal": subtotal, "updated_at": cart.updated_at}

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.cart import CartItemAdd, CartItemUpdate, CartMessage, CartResponse
from app.services import cart_service

router = APIRouter()


@router.get("", response_model=CartResponse)
def get_cart(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    return cart_service.serialize_cart(cart_service.get_or_create_cart(db, current_user.id))


@router.post("/items", response_model=CartResponse, status_code=status.HTTP_200_OK)
def add_cart_item(
    payload: CartItemAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    cart = cart_service.add_item(db, current_user.id, payload.product_id, payload.quantity)
    return cart_service.serialize_cart(cart)


@router.patch("/items/{item_id}", response_model=CartResponse)
def update_cart_item(
    item_id: int,
    payload: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    cart = cart_service.update_item(db, current_user.id, item_id, payload.quantity)
    return cart_service.serialize_cart(cart)


@router.delete("/items/{item_id}", response_model=CartMessage)
def delete_cart_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CartMessage:
    cart_service.remove_item(db, current_user.id, item_id)
    return CartMessage(message="Cart item removed")

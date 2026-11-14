from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.order import CheckoutRequest, OrderListResponse, OrderResponse
from app.services import order_service

router = APIRouter()


@router.post("/checkout", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def checkout(
    payload: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return order_service.checkout(db, current_user.id, payload.shipping_address.model_dump())


@router.get("", response_model=OrderListResponse)
def list_my_orders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    orders = order_service.list_orders(db, current_user.id)
    return {"items": orders, "total": len(orders)}


@router.get("/{order_id}", response_model=OrderResponse)
def get_my_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return order_service.get_order(db, current_user.id, order_id)

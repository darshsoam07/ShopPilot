from fastapi import HTTPException, APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.order import CheckoutRequest, CouponValidateRequest, CouponValidateResponse, OrderListResponse, OrderResponse
from app.services import order_service

router = APIRouter()


@router.post("/checkout", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def checkout(
    payload: CheckoutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    address = {}
    if payload.shipping_address:
        address = payload.shipping_address.model_dump()
    elif payload.shipping:
        shipping = payload.shipping
        address = {"recipient_name": shipping.full_name, "address_line1": shipping.address,
                   "city": shipping.city, "postal_code": shipping.postal_code}
        address.update(shipping.model_dump(include={"country", "phone", "billing_address"}, exclude_none=True))
    if payload.billing_address:
        address["billing_address"] = payload.billing_address
    if payload.carrier:
        address["carrier"] = payload.carrier
    return order_service.checkout(db, current_user.id, address, payload.payment_method, payload.coupon_code, carrier=payload.carrier,
                                  address_id=payload.address_id, key=payload.idempotency_key, decline=payload.simulate_failure)


@router.post("/validate-coupon", response_model=CouponValidateResponse)
def check_coupon(payload: CouponValidateRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return order_service.validate_coupon(db, payload.code, payload.subtotal)


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

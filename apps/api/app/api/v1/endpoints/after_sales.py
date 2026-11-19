from datetime import datetime
from decimal import Decimal
from typing import Annotated, Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, StringConstraints
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_admin_user, get_current_user
from app.db.session import get_db
from app.models.after_sales import ServiceRequest
from app.models.user import User
from app.services import after_sales

router = APIRouter()
Kind = Literal["cancellation", "return"]


class RequestInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    kind: Kind
    reason: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=500)]


class Decision(BaseModel):
    status: Literal["APPROVED", "REJECTED", "RECEIVED", "COMPLETED"]


class RefundView(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    amount: Decimal
    currency: str
    reference: str
    provider: str
    status: str


class RequestView(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    order_id: int
    kind: Kind
    status: str
    reason: str
    created_at: datetime
    decided_at: datetime | None
    received_at: datetime | None
    completed_at: datetime | None
    refund: RefundView | None


@router.post("/orders/{order_id}/after-sales", response_model=RequestView, status_code=201)
def create(order_id: int, payload: RequestInput, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return after_sales.create(db, order_id, user.id, payload.kind, payload.reason)


@router.get("/after-sales", response_model=list[RequestView])
def mine(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.scalars(select(ServiceRequest).where(ServiceRequest.user_id == user.id)
                      .options(selectinload(ServiceRequest.refund)).order_by(ServiceRequest.id.desc())).all()


@router.get("/admin/after-sales")
def queue(kind: Kind | None = None, status: str | None = None, db: Session = Depends(get_db),
          admin: User = Depends(get_admin_user)):
    query = select(ServiceRequest).options(selectinload(ServiceRequest.refund), selectinload(ServiceRequest.order))
    if kind:
        query = query.where(ServiceRequest.kind == kind)
    if status:
        query = query.where(ServiceRequest.status == status)
    return [dict(**RequestView.model_validate(row).model_dump(), customer_id=row.user_id,
                 payment_status=row.order.payment.status if row.order.payment else "unrecorded",
                 items=[f"{i.product_name} ({i.sku}) × {i.quantity}" for i in row.order.items])
            for row in db.scalars(query.order_by(ServiceRequest.id.desc()))]


@router.patch("/admin/after-sales/{request_id}", response_model=RequestView)
def decide(request_id: int, payload: Decision, db: Session = Depends(get_db), admin: User = Depends(get_admin_user)):
    return after_sales.decide(db, request_id, payload.status)

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.order import Address, PaymentAttempt
from app.models.user import User
from app.schemas.order import AddressWrite, AddressPatch, AddressResponse, PaymentResponse
from app.services import address_service

router = APIRouter()


@router.get("/addresses", response_model=list[AddressResponse])
def addresses(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(select(Address).where(Address.user_id == user.id).order_by(Address.is_default.desc(), Address.id)).all()


@router.post("/addresses", response_model=AddressResponse, status_code=201)
def create(payload: AddressWrite, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return address_service.save(db, user.id, payload)


@router.patch("/addresses/{address_id}", response_model=AddressResponse)
def edit(address_id: int, payload: AddressPatch, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return address_service.save(db, user.id, payload, address_id)


@router.delete("/addresses/{address_id}", status_code=204)
def delete(address_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    address_service.remove(db, user.id, address_id)


@router.get("/payments", response_model=list[PaymentResponse])
def payments(limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0),
             user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(select(PaymentAttempt).where(PaymentAttempt.user_id == user.id)
                      .order_by(PaymentAttempt.id.desc()).offset(offset).limit(limit)).all()


@router.get("/payments/{payment_id}", response_model=PaymentResponse)
def payment(payment_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    attempt = db.scalar(select(PaymentAttempt).where(PaymentAttempt.id == payment_id, PaymentAttempt.user_id == user.id))
    if attempt is None:
        raise HTTPException(404, "Payment not found")
    return attempt

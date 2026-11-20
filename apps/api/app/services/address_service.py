from fastapi import HTTPException
from sqlalchemy import select, update
from app.models.order import Address
from app.models.user import User


def lock_customer(db, user_id):
    db.execute(select(User.id).where(User.id == user_id).with_for_update()).one()


def get(db, user_id, address_id):
    row = db.scalar(select(Address).where(Address.id == address_id, Address.user_id == user_id))
    if row is None:
        raise HTTPException(404, "Address not found")
    return row


def save(db, user_id, payload, address_id=None):
    lock_customer(db, user_id)
    row = get(db, user_id, address_id) if address_id is not None else Address(user_id=user_id)
    if payload.is_default:
        db.execute(update(Address).where(Address.user_id == user_id, Address.is_default.is_(True)).values(is_default=False))
    if payload.is_default is not None:
        row.is_default = payload.is_default
    if payload.details is not None:
        row.details = payload.details.model_dump(exclude_none=True)
    db.add(row)
    db.commit()
    return row


def remove(db, user_id, address_id):
    lock_customer(db, user_id)
    db.delete(get(db, user_id, address_id))
    db.commit()

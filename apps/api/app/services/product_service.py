from fastapi import HTTPException
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.product import Product
from app.schemas.product import AdminProductCreate, AdminProductUpdate


def list_products(db: Session, *, query: str | None = None, limit: int = 20, offset: int = 0, include_inactive: bool = False,
                  min_price=None, max_price=None, in_stock=False, category=None, sort="newest"):
    filters = [] if include_inactive else [Product.is_active.is_(True)]
    if query:
        term = f"%{query.strip()}%"
        filters.append(or_(Product.name.ilike(term), Product.description.ilike(term), Product.sku.ilike(term)))
    if min_price is not None:
        filters.append(Product.price >= min_price)
    if max_price is not None:
        filters.append(Product.price <= max_price)
    if in_stock:
        filters.append(Product.stock_quantity > 0)
    if category:
        filters.append(Product.sku.istartswith(category + "-", autoescape=True))
    ordering = {"price_asc": Product.price.asc(), "price_desc": Product.price.desc(),
                "name_asc": Product.name.asc(), "newest": Product.created_at.desc()}
    total = db.scalar(select(func.count()).select_from(Product).where(*filters)) or 0
    items = list(db.scalars(select(Product).where(*filters).order_by(ordering[sort], Product.id).limit(limit).offset(offset)).all())
    return items, total


def get_active_product(db: Session, product_id: int) -> Product:
    product = db.scalar(select(Product).where(Product.id == product_id, Product.is_active.is_(True)))
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


def create_product(db: Session, payload: AdminProductCreate) -> Product:
    product = Product(**payload.model_dump())
    db.add(product)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="A product with this SKU or slug already exists") from exc
    db.refresh(product)
    return product


def update_product(db: Session, product_id: int, payload: AdminProductUpdate) -> Product:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    changes = payload.model_dump(exclude_unset=True)
    forbidden_nulls = {key for key, value in changes.items() if value is None and key != "image_url"}
    if forbidden_nulls:
        raise HTTPException(status_code=422, detail=f"Fields cannot be null: {', '.join(sorted(forbidden_nulls))}")
    for field, value in changes.items():
        setattr(product, field, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="A product with this SKU or slug already exists") from exc
    db.refresh(product)
    return product


def deactivate_product(db: Session, product_id: int) -> Product:
    return update_product(db, product_id, AdminProductUpdate(is_active=False))

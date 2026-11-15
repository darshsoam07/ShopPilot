from sqlalchemy import select, func, or_
from app.models.product import Product
from app.schemas.product import CatalogResponse
from decimal import Decimal
from typing import Literal
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.product import ProductListResponse, ProductResponse
from app.services.product_service import get_active_product, list_products

router = APIRouter()


@router.get("", response_model=ProductListResponse)
def list_public_products(
    q: str | None = Query(default=None, min_length=1, max_length=100),
    limit: int = Query(default=20, ge=1, le=100),
    category: str | None = Query(None, max_length=100),
    min_price: Decimal | None = Query(None, ge=0),
    max_price: Decimal | None = Query(None, ge=0),
    in_stock: bool = False,
    sort: Literal["newest", "price_asc", "price_desc", "name_asc"] = "newest",
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> ProductListResponse:
    products, total = list_products(db, query=q, limit=limit, offset=offset, category=category,
                                    min_price=min_price, max_price=max_price, in_stock=in_stock, sort=sort)
    return ProductListResponse(items=products, total=total, limit=limit, offset=offset)


@router.get("/catalog", response_model=CatalogResponse)
def catalog(q: str = "", categories: str = "", availability: Literal["in_stock", "out_of_stock"] | None = None,
            min_price: Decimal | None = Query(None, ge=0), max_price: Decimal | None = Query(None, ge=0),
            sort: Literal["relevance", "price_asc", "price_desc", "newest"] = "relevance",
            page: int = Query(1, ge=1), page_size: int = Query(9, ge=1, le=48), db: Session = Depends(get_db)):
    filters = [Product.is_active.is_(True)]
    if q:
        filters.append(or_(Product.name.icontains(q, autoescape=True), Product.description.icontains(q, autoescape=True)))
    if availability:
        filters.append(Product.stock_quantity > 0 if availability == "in_stock" else Product.stock_quantity == 0)
    if min_price is not None:
        filters.append(Product.price >= min_price)
    if max_price is not None:
        filters.append(Product.price <= max_price)
    counts = dict(db.execute(select(Product.category, func.count()).where(*filters).group_by(Product.category)).all())
    selected = [name.strip() for name in categories.split(",") if name.strip()]
    if selected:
        filters.append(Product.category.in_(selected))
    order = {"relevance": Product.stock_quantity.desc(), "price_asc": Product.price.asc(),
             "price_desc": Product.price.desc(), "newest": Product.created_at.desc()}[sort]
    items = db.scalars(select(Product).where(*filters).order_by(order, Product.id)
                       .offset((page-1)*page_size).limit(page_size)).all()
    total = sum(count for name, count in counts.items() if not selected or name in selected)
    return dict(items=items, total=total, categories=counts, page=page, page_size=page_size)


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    return get_active_product(db, product_id)

@router.get("/{product_id}/variants", response_model=list[ProductResponse])
def variants(product_id: int, db: Session = Depends(get_db)):
    product = get_active_product(db, product_id)
    if not product.family:
        return [product]
    return db.scalars(select(Product).where(Product.family == product.family, Product.is_active.is_(True))
                      .order_by(Product.price, Product.id)).all()

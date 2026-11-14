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
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> ProductListResponse:
    products, total = list_products(db, query=q, limit=limit, offset=offset)
    return ProductListResponse(items=products, total=total, limit=limit, offset=offset)


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    return get_active_product(db, product_id)

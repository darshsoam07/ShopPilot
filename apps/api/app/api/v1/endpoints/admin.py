from fastapi import APIRouter, Depends, File, Query, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_admin_user
from app.db.session import get_db
from app.models.product import Product
from app.models.user import User
from app.schemas.product import AdminProductCreate, AdminProductUpdate, ProductListResponse, ProductResponse
from app.schemas.order import OrderListResponse, OrderResponse, OrderStatusUpdate
from app.services import order_service, product_service
from app.services.storage import storage_service

router = APIRouter()


@router.get("/products", response_model=ProductListResponse)
def admin_list_products(
    q: str | None = None,
    limit: int = 50,
    offset: int = 0,
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    items, total = product_service.list_products(db, query=q, limit=min(max(limit, 1), 100), offset=max(offset, 0), include_inactive=True)
    return {"items": items, "total": total, "limit": min(max(limit, 1), 100), "offset": max(offset, 0)}


@router.post("/products", response_model=ProductResponse, status_code=201)
def admin_create_product(
    payload: AdminProductCreate,
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    return product_service.create_product(db, payload)


@router.patch("/products/{product_id}", response_model=ProductResponse)
def admin_update_product(
    product_id: int,
    payload: AdminProductUpdate,
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    return product_service.update_product(db, product_id, payload)


@router.delete("/products/{product_id}", response_model=ProductResponse)
def admin_deactivate_product(
    product_id: int,
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    return product_service.deactivate_product(db, product_id)


@router.post("/products/{product_id}/image", response_model=ProductResponse)
async def admin_upload_product_image(
    product_id: int,
    image: UploadFile = File(...),
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    if db.get(Product, product_id) is None:
        raise HTTPException(status_code=404, detail="Product not found")
    image_url = await storage_service.save_product_image(image)
    return product_service.update_product(db, product_id, AdminProductUpdate(image_url=image_url))


@router.get("/orders", response_model=OrderListResponse)
def list_orders(status: str | None = None, limit: int = Query(20, ge=1, le=100),
                offset: int = Query(0, ge=0), admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    return order_service.list_admin_orders(db, status, limit, offset)


@router.patch("/orders/{order_id}/status", response_model=OrderResponse)
def update_order_status(order_id: int, payload: OrderStatusUpdate,
                        admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    return order_service.update_status(db, order_id, payload.status)

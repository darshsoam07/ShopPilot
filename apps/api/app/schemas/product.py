from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ProductMetadata(BaseModel):
    family: str | None = Field(None, max_length=100)
    category: str = Field(default="Collection", min_length=1, max_length=80)
    brand: str | None = Field(default=None, max_length=100)
    rating: Decimal | None = Field(default=None, ge=0, le=5)
    review_count: int = Field(default=0, ge=0)
    gallery_images: list[str] = Field(default_factory=list)
    specifications: dict[str, str] = Field(default_factory=dict)


class ProductResponse(ProductMetadata):
    id: int
    name: str
    slug: str
    description: str
    sku: str
    price: Decimal
    stock_quantity: int
    image_url: str | None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductListResponse(BaseModel):
    items: list[ProductResponse]
    total: int
    limit: int = Field(ge=1, le=100)
    offset: int = Field(ge=0)


class AdminProductCreate(ProductMetadata):
    name: str = Field(min_length=2, max_length=180)
    slug: str = Field(min_length=2, max_length=200)
    description: str = Field(default="", max_length=10000)
    sku: str = Field(min_length=2, max_length=64)
    price: Decimal = Field(ge=0, max_digits=10, decimal_places=2)
    stock_quantity: int = Field(default=0, ge=0)
    image_url: str | None = Field(default=None, max_length=1000)
    is_active: bool = True


class AdminProductUpdate(ProductMetadata):
    name: str | None = Field(default=None, min_length=2, max_length=180)
    slug: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=10000)
    sku: str | None = Field(default=None, min_length=2, max_length=64)
    price: Decimal | None = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    stock_quantity: int | None = Field(default=None, ge=0)
    image_url: str | None = Field(default=None, max_length=1000)
    is_active: bool | None = None

class CatalogResponse(BaseModel):
    items: list[ProductResponse]
    total: int
    page: int
    page_size: int
    categories: dict[str, int]

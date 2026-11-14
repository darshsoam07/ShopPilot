from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CartItemAdd(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(default=1, ge=1, le=99)


class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=1, le=99)


class CartProductSummary(BaseModel):
    id: int
    name: str
    sku: str
    price: Decimal
    image_url: str | None
    stock_quantity: int

    model_config = ConfigDict(from_attributes=True)


class CartItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    product: CartProductSummary

    model_config = ConfigDict(from_attributes=True)


class CartResponse(BaseModel):
    id: int
    items: list[CartItemResponse]
    item_count: int
    subtotal: Decimal
    updated_at: datetime


class CartMessage(BaseModel):
    message: str

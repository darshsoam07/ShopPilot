from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ShippingAddress(BaseModel):
    recipient_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=7, max_length=20)
    address_line1: str = Field(min_length=3, max_length=240)
    address_line2: str | None = Field(default=None, max_length=240)
    city: str = Field(min_length=2, max_length=100)
    state: str = Field(min_length=2, max_length=100)
    postal_code: str = Field(min_length=4, max_length=12)
    country: str = Field(default="India", min_length=2, max_length=80)


class CheckoutRequest(BaseModel):
    shipping_address: ShippingAddress


class OrderItemResponse(BaseModel):
    id: int
    product_id: int | None
    product_name: str
    sku: str
    unit_price: Decimal
    quantity: int
    line_total: Decimal

    model_config = ConfigDict(from_attributes=True)


class OrderResponse(BaseModel):
    id: int
    status: str
    total_amount: Decimal
    currency: str
    shipping_address: dict
    created_at: datetime
    items: list[OrderItemResponse]

    model_config = ConfigDict(from_attributes=True)


class OrderListResponse(BaseModel):
    items: list[OrderResponse]
    total: int

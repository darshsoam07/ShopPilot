from typing import Literal
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ShippingAddress(BaseModel):
    recipient_name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=7, max_length=20)
    address_line1: str = Field(min_length=3, max_length=240)
    address_line2: str | None = Field(default=None, max_length=240)
    city: str = Field(min_length=2, max_length=100)
    state: str = Field(min_length=2, max_length=100)
    postal_code: str = Field(min_length=4, max_length=12)
    country: str = Field(default="India", min_length=2, max_length=80)


class ShippingDetails(BaseModel):
    country: str | None = Field(None, max_length=80)
    phone: str | None = Field(None, min_length=7, max_length=20)
    billing_address: str | None = Field(None, max_length=255)
    full_name: str = Field(min_length=2, max_length=120)
    address: str = Field(min_length=5, max_length=255)
    city: str = Field(min_length=2, max_length=100)
    postal_code: str = Field(min_length=3, max_length=32)


class CheckoutRequest(BaseModel):
    billing_address: str | None = Field(None, max_length=255)
    address_id: int | None = Field(None, gt=0)
    idempotency_key: str | None = Field(None, min_length=1, max_length=100)
    carrier: Literal["DHL", "FedEx", "GLS"] | None = None
    simulate_failure: bool = False
    shipping_address: ShippingAddress | None = None
    shipping: ShippingDetails | None = None
    payment_method: Literal["card", "upi", "cod"] = "card"
    coupon_code: str | None = Field(default=None, max_length=32)

    @model_validator(mode="after")
    def one_address(self):
        if sum(v is not None for v in (self.shipping_address, self.shipping, self.address_id)) != 1:
            raise ValueError("Supply one shipping address")
        return self


class CouponValidateRequest(BaseModel):
    code: str = Field(min_length=1, max_length=32)
    subtotal: Decimal = Field(ge=0, max_digits=12, decimal_places=2)


class CouponValidateResponse(BaseModel):
    valid: bool
    code: str
    discount_percent: Decimal = Decimal(0)
    discount_amount: Decimal = Decimal(0)
    final_total: Decimal
    message: str


class OrderItemResponse(BaseModel):
    id: int
    product_id: int | None
    product_name: str
    sku: str
    unit_price: Decimal
    quantity: int
    line_total: Decimal

    model_config = ConfigDict(from_attributes=True)


class AddressDetails(ShippingAddress):
    state: str | None = Field(None, min_length=2, max_length=100)


class AddressWrite(BaseModel):
    details: AddressDetails
    is_default: bool = False


class AddressPatch(BaseModel):
    details: AddressDetails | None = None
    is_default: bool | None = None


class AddressResponse(AddressWrite):
    id: int
    model_config = ConfigDict(from_attributes=True)


class PaymentResponse(BaseModel):
    id: int
    order_id: int | None
    payment_method: str
    status: str
    amount: Decimal
    currency: str
    provider: str
    reference: str
    failure_reason: str | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class OrderResponse(BaseModel):
    payment: PaymentResponse | None = None
    id: int
    status: str
    total_amount: Decimal
    shipping_cost: Decimal
    subtotal_amount: Decimal | None
    discount_amount: Decimal
    coupon_code: str | None
    payment_method: str
    receipt_number: str | None
    currency: str
    shipping_address: dict
    created_at: datetime
    items: list[OrderItemResponse]

    model_config = ConfigDict(from_attributes=True)


class OrderListResponse(BaseModel):
    items: list[OrderResponse]
    total: int


class OrderStatusUpdate(BaseModel):
    status: Literal["PROCESSING", "SHIPPED", "DELIVERED"]

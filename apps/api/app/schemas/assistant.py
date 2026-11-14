from decimal import Decimal

from pydantic import BaseModel, Field

from app.schemas.product import ProductResponse


class RecommendationRequest(BaseModel):
    query: str = Field(min_length=2, max_length=500)
    max_price: Decimal | None = Field(default=None, gt=0)
    limit: int = Field(default=5, ge=1, le=10)


class RecommendationResponse(BaseModel):
    agent: str
    explanation: str
    items: list[ProductResponse]
    total: int

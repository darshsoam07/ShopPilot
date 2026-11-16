from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    title: str = Field(..., min_length=3, max_length=120)
    comment: str = Field(..., min_length=10, max_length=2000)


class ReviewRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    user_id: int
    author_name: str
    rating: int
    title: str
    comment: str
    is_verified_purchase: bool
    created_at: datetime


class AISentimentDigest(BaseModel):
    average_rating: float
    total_reviews: int
    verified_count: int
    sentiment_label: Literal[
        "Overwhelmingly Positive",
        "Positive",
        "Mixed",
        "Needs Attention",
        "No Reviews Yet",
    ]
    summary: str
    pros: list[str] = Field(default_factory=list)
    cons: list[str] = Field(default_factory=list)


class ProductReviewsResponse(BaseModel):
    digest: AISentimentDigest
    reviews: list[ReviewRead]
    can_review: bool

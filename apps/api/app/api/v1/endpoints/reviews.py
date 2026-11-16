from typing import Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api import deps
from app.models.user import User
from app.schemas.review import ProductReviewsResponse, ReviewCreate, ReviewRead
from app.services import review_service

router = APIRouter()


@router.get("/{product_id}/reviews", response_model=ProductReviewsResponse)
def list_product_reviews(
    product_id: int,
    db: Session = Depends(deps.get_db),
    current_user: Optional[User] = Depends(deps.get_optional_user),
) -> ProductReviewsResponse:
    return review_service.get_product_reviews_bundle(db, product_id, current_user)


@router.post(
    "/{product_id}/reviews",
    response_model=ReviewRead,
    status_code=status.HTTP_201_CREATED,
)
def submit_product_review(
    product_id: int,
    payload: ReviewCreate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> ReviewRead:
    return review_service.create_or_update_verified_review(
        db, product_id, current_user, payload
    )

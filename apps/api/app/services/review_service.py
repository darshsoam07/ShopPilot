from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.review import ProductReview
from app.models.user import User
from app.schemas.review import (
    AISentimentDigest,
    ProductReviewsResponse,
    ReviewCreate,
    ReviewRead,
)

ELIGIBLE_ORDER_STATUSES = {"PAID", "PROCESSING", "SHIPPED", "DELIVERED"}

THEME_KEYWORDS: dict[str, tuple[str, ...]] = {
    "Sound & Audio Clarity": ("sound", "audio", "bass", "clarity", "anc", "noise", "mic"),
    "Build Quality & Finish": ("build", "quality", "premium", "sturdy", "finish", "design", "sleek"),
    "Battery & Endurance": ("battery", "charge", "charging", "hours", "life"),
    "Comfort & Ergonomics": ("comfort", "comfortable", "fit", "lightweight", "ergonomic", "ear"),
    "Value & Bundle Extras": ("value", "worth", "price", "bundle", "case", "cable", "protection"),
    "Delivery & Packaging": ("shipping", "delivery", "fast", "arrived", "packaging"),
}


def has_verified_purchase(db: Session, user_id: int, product_id: int) -> bool:
    stmt = (
        select(OrderItem.id)
        .join(Order, Order.id == OrderItem.order_id)
        .where(
            Order.user_id == user_id,
            OrderItem.product_id == product_id,
            Order.status.in_(ELIGIBLE_ORDER_STATUSES),
        )
        .limit(1)
    )
    return db.scalar(stmt) is not None


def _format_author_name(user: Optional[User]) -> str:
    if not user:
        return "Verified Shopper"
    full_name = getattr(user, "full_name", None)
    if full_name and full_name.strip():
        parts = full_name.strip().split()
        return f"{parts[0]} {parts[-1][0]}." if len(parts) > 1 else parts[0]
    email = getattr(user, "email", "")
    return email.split("@")[0] if "@" in email else "Verified Shopper"


def build_ai_sentiment_digest(
    product_name: str, reviews: list[ProductReview]
) -> AISentimentDigest:
    total = len(reviews)
    if total == 0:
        return AISentimentDigest(
            average_rating=0.0,
            total_reviews=0,
            verified_count=0,
            sentiment_label="No Reviews Yet",
            summary=(
                f"No verified buyer reviews have been posted for {product_name} yet. "
                "Purchase this configuration to leave the first verified review."
            ),
            pros=[],
            cons=[],
        )

    avg = round(sum(r.rating for r in reviews) / total, 2)
    verified_count = sum(1 for r in reviews if r.is_verified_purchase)

    if avg >= 4.5:
        label = "Overwhelmingly Positive"
    elif avg >= 3.8:
        label = "Positive"
    elif avg >= 2.8:
        label = "Mixed"
    else:
        label = "Needs Attention"

    # Extract top praised themes from 4-5 star reviews and caveats from 1-3 star reviews
    pro_scores: dict[str, int] = {k: 0 for k in THEME_KEYWORDS}
    con_scores: dict[str, int] = {k: 0 for k in THEME_KEYWORDS}

    for r in reviews:
        blob = f"{r.title} {r.comment}".lower()
        target_bucket = pro_scores if r.rating >= 4 else con_scores
        for theme, keywords in THEME_KEYWORDS.items():
            if any(kw in blob for kw in keywords):
                target_bucket[theme] += 1

    pros = [k for k, v in sorted(pro_scores.items(), key=lambda x: -x[1]) if v > 0][:3]
    cons = [k for k, v in sorted(con_scores.items(), key=lambda x: -x[1]) if v > 0][:2]



    pros_clause = (
        f"Higher-rated reviews mention {', '.join(pros).lower()}."
        if pros
        else "Feedback covers general day-to-day usage."
    )
    cons_clause = (
        f" Lower-rated reviews mention {', '.join(cons).lower()}."
        if cons
        else ""
    )

    summary = (
        f"Based on {total} review{'s' if total != 1 else ''} ({verified_count} verified), "
        f"{product_name} holds a {avg:.1f}/5.0 rating ({label}). "
        f"{pros_clause}{cons_clause}"
    )

    return AISentimentDigest(
        average_rating=avg,
        total_reviews=total,
        verified_count=verified_count,
        sentiment_label=label,
        summary=summary,
        pros=pros,
        cons=cons,
    )


def get_product_reviews_bundle(
    db: Session, product_id: int, current_user: Optional[User] = None
) -> ProductReviewsResponse:
    product = db.get(Product, product_id)
    if not product or not product.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product #{product_id} not found.",
        )

    stmt = (
        select(ProductReview)
        .options(joinedload(ProductReview.user))
        .where(ProductReview.product_id == product_id)
        .order_by(ProductReview.created_at.desc(), ProductReview.id.desc())
    )
    rows = list(db.scalars(stmt).all())

    review_reads = [
        ReviewRead(
            id=r.id,
            product_id=r.product_id,
            user_id=r.user_id,
            author_name=_format_author_name(r.user),
            rating=r.rating,
            title=r.title,
            comment=r.comment,
            is_verified_purchase=r.is_verified_purchase,
            created_at=r.created_at,
        )
        for r in rows
    ]

    digest = build_ai_sentiment_digest(product.name, rows)
    can_review = (
        has_verified_purchase(db, current_user.id, product_id)
        if current_user
        else False
    )

    return ProductReviewsResponse(
        digest=digest,
        reviews=review_reads,
        can_review=can_review,
    )


def create_or_update_verified_review(
    db: Session, product_id: int, user: User, payload: ReviewCreate
) -> ReviewRead:
    product = db.get(Product, product_id)
    if not product or not product.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product #{product_id} not found.",
        )

    if not has_verified_purchase(db, user.id, product_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only verified buyers who have purchased this SKU can submit a review.",
        )

    db.scalar(select(Product.id).where(Product.id == product_id).with_for_update())
    existing = db.scalar(
        select(ProductReview).where(
            ProductReview.product_id == product_id,
            ProductReview.user_id == user.id,
        )
    )

    if existing:
        existing.rating = payload.rating
        existing.title = payload.title.strip()
        existing.comment = payload.comment.strip()
        existing.is_verified_purchase = True
        review_obj = existing
    else:
        review_obj = ProductReview(
            product_id=product_id,
            user_id=user.id,
            rating=payload.rating,
            title=payload.title.strip(),
            comment=payload.comment.strip(),
            is_verified_purchase=True,
        )
        db.add(review_obj)

    db.flush()
    product.review_count, product.rating = db.execute(
        select(func.count(ProductReview.id), func.avg(ProductReview.rating)).where(ProductReview.product_id == product_id)
    ).one()
    db.commit()
    db.refresh(review_obj)

    return ReviewRead(
        id=review_obj.id,
        product_id=review_obj.product_id,
        user_id=review_obj.user_id,
        author_name=_format_author_name(user),
        rating=review_obj.rating,
        title=review_obj.title,
        comment=review_obj.comment,
        is_verified_purchase=review_obj.is_verified_purchase,
        created_at=review_obj.created_at,
    )

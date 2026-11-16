import re
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.agents import shopping_agent
from app.schemas.assistant import AssistantQueryRequest, AssistantQueryResponse
from app.api.deps import get_current_user, get_optional_user
from app.db.session import get_db
from app.models.order import Order
from app.models.product import Product
from app.models.chat import ChatMessage, ChatSession
from app.models.user import User
from app.schemas.assistant import RecommendationRequest, RecommendationResponse
from app.schemas.order import OrderResponse
from app.services.order_service import get_order

router = APIRouter()


def _extract_budget(text: str) -> Decimal | None:
    normalized = text.replace(",", "")
    match = re.search(r"(?:under|below|within|less than|budget(?: of)?)\s*(?:₹|rs\.?\s*)?(\d+(?:\.\d+)?)", normalized, re.IGNORECASE)
    if not match:
        match = re.search(r"(?:₹|rs\.?\s*)(\d+(?:\.\d+)?)", normalized, re.IGNORECASE)
    return Decimal(match.group(1)) if match else None


@router.post("/recommendations", response_model=RecommendationResponse)
def recommendations(payload: RecommendationRequest, db: Session = Depends(get_db)) -> RecommendationResponse:
    budget = payload.max_price or _extract_budget(payload.query)
    words = [word for word in re.findall(r"[a-zA-Z0-9]{3,}", payload.query.lower()) if word not in {"under", "below", "within", "less", "than", "for", "with", "the", "and"}]
    statement = select(Product).where(Product.is_active.is_(True), Product.stock_quantity > 0)
    if budget is not None:
        statement = statement.where(Product.price <= budget)
    if words:
        term_filters = [or_(Product.name.ilike(f"%{word}%"), Product.description.ilike(f"%{word}%"), Product.sku.ilike(f"%{word}%")) for word in words]
        # At least one meaningful query token should match; keep catalogue-driven results grounded.
        statement = statement.where(or_(*term_filters))
    products = list(db.scalars(statement.order_by(Product.price.asc(), Product.name.asc()).limit(payload.limit)).all())
    explanation = "Matches are selected from active, in-stock catalogue products."
    if budget is not None:
        explanation += f" Results are limited to ₹{budget:,.2f}."
    if not products:
        explanation = "No in-stock products matched these criteria. Try a broader search or a higher budget."
    return RecommendationResponse(agent="catalog-rule-based-v1", explanation=explanation, items=products, total=len(products))


@router.get("/orders/{order_id}", response_model=OrderResponse)
def assistant_order_lookup(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # The same ownership check as the standard order API; the assistant is not a privilege boundary.
    return get_order(db, current_user.id, order_id)


@router.post("/chat", response_model=AssistantQueryResponse)
def chat(payload: AssistantQueryRequest, db: Session = Depends(get_db), user: User | None = Depends(get_optional_user)):
    result = shopping_agent.run(db, user, payload)
    if user:
        db.scalar(select(User.id).where(User.id == user.id).with_for_update())
        thread = db.scalar(select(ChatSession).where(ChatSession.user_id == user.id))
        if thread is None:
            thread = ChatSession(user_id=user.id)
            db.add(thread)
            db.flush()
        body = result.model_dump(mode="json")
        body["content"] = body.pop("reply")
        db.add_all([ChatMessage(session_id=thread.id, role="user", body={"content": payload.message}),
                    ChatMessage(session_id=thread.id, role="assistant", body=body)])
        db.commit()
    return result


@router.get("/history")
def history(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(ChatMessage).join(ChatSession).where(ChatSession.user_id == user.id)
                      .order_by(ChatMessage.id.desc()).limit(100)).all()
    return [{"role": row.role, **row.body} for row in reversed(rows)]

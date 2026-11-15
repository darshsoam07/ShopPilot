from typing import Literal, Any
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

class ChatMessageInput(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class AssistantContext(BaseModel):
    active_product_id: int | None = None
    active_category: str | None = None
    max_budget: Decimal | None = None


class AssistantQueryRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    history: list[ChatMessageInput] = Field(default_factory=list, max_length=16)
    context: AssistantContext | None = None


class AgentToolAction(BaseModel):
    tool_name: Literal[
        "catalog_search",
        "add_to_cart",
        "compare_products",
        "product_qa",
        "none",
    ]
    status: Literal["executed", "requires_auth", "failed", "skipped"]
    summary: str
    payload: dict[str, Any] = Field(default_factory=dict)


class AssistantQueryResponse(BaseModel):
    reply: str
    recommended_products: list[ProductResponse] = Field(default_factory=list)
    action: AgentToolAction | None = None
    follow_up_prompts: list[str] = Field(default_factory=list)

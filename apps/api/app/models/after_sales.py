from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Index, Numeric, String, func, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.order import Order


class ServiceRequest(Base):
    __tablename__ = "service_requests"
    __table_args__ = (Index("uq_open_request", "order_id", unique=True,
                            sqlite_where=text("status <> 'REJECTED'"),
                            postgresql_where=text("status <> 'REJECTED'")),)
    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    kind: Mapped[str] = mapped_column(String(16))
    reason: Mapped[str] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(16), default="REQUESTED")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    received_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    order: Mapped[Order] = relationship()
    refund: Mapped["Refund | None"] = relationship()


class Refund(Base):
    __tablename__ = "refunds"
    id: Mapped[int] = mapped_column(primary_key=True)
    request_id: Mapped[int] = mapped_column(ForeignKey("service_requests.id"), unique=True)
    payment_id: Mapped[int] = mapped_column(ForeignKey("payment_attempts.id"), unique=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(3))
    provider: Mapped[str] = mapped_column(String(16), default="simulated")
    reference: Mapped[str] = mapped_column(String(40), unique=True)
    status: Mapped[str] = mapped_column(String(16), default="COMPLETED")
    reason: Mapped[str] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

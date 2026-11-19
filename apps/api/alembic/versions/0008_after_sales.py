"""Record delivery time, full-order requests and simulated refunds."""
from alembic import op
import sqlalchemy as sa

revision = "0008_after_sales"
down_revision = "0007_address_payments"
branch_labels = depends_on = None


def upgrade():
    op.add_column("orders", sa.Column("delivered_at", sa.DateTime(timezone=True)))
    op.execute("UPDATE orders SET delivered_at = updated_at WHERE status = 'DELIVERED'")
    op.create_table("service_requests",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("order_id", sa.Integer, sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("kind", sa.String(16), nullable=False),
        sa.Column("reason", sa.String(500), nullable=False),
        sa.Column("status", sa.String(16), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        *(sa.Column(name, sa.DateTime(timezone=True)) for name in ("decided_at", "received_at", "completed_at")))
    active = sa.text("status <> 'REJECTED'")
    op.create_index("uq_open_request", "service_requests", ["order_id"], unique=True,
                    sqlite_where=active, postgresql_where=active)
    op.create_table("refunds",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("order_id", sa.Integer, sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("request_id", sa.Integer, sa.ForeignKey("service_requests.id"), nullable=False, unique=True),
        sa.Column("payment_id", sa.Integer, sa.ForeignKey("payment_attempts.id"), nullable=False, unique=True),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False),
        sa.Column("provider", sa.String(16), nullable=False),
        sa.Column("reference", sa.String(40), unique=True, nullable=False),
        sa.Column("status", sa.String(16), nullable=False),
        sa.Column("reason", sa.String(500), nullable=False),
        *(sa.Column(name, sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
          for name in ("created_at", "completed_at")))


def downgrade():
    op.drop_table("refunds")
    op.drop_table("service_requests")
    op.drop_column("orders", "delivered_at")

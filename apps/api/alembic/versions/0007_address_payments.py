"""Store owned addresses and simulated payment attempts."""
from alembic import op
import sqlalchemy as sa

revision = "0007_address_payments"
down_revision = "0006_assistant_history"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table("addresses",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("details", sa.JSON, nullable=False),
        sa.Column("is_default", sa.Boolean, nullable=False))
    op.create_index("uq_address_default", "addresses", ["user_id"], unique=True,
                    sqlite_where=sa.text("is_default"), postgresql_where=sa.text("is_default"))
    op.create_table("payment_attempts",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Integer, sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("order_id", sa.Integer, sa.ForeignKey("orders.id"), unique=True),
        sa.Column("payment_method", sa.String(8), nullable=False),
        sa.Column("status", sa.String(16), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False),
        sa.Column("provider", sa.String(8), nullable=False),
        sa.Column("reference", sa.String(40), nullable=False, unique=True),
        sa.Column("idempotency_key", sa.String(100), nullable=False),
        sa.Column("failure_reason", sa.String(120)),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "idempotency_key"))


def downgrade():
    op.drop_table("payment_attempts")
    op.drop_table("addresses")

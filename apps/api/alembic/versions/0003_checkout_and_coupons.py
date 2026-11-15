"""add coupons table and checkout fields to orders

Revision ID: 0003_checkout_and_coupons
Revises: 0002_cart_orders
Create Date: 2026-11-15
"""
from alembic import op
import sqlalchemy as sa

revision = "0003_checkout_and_coupons"
down_revision = "0002_cart_orders"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "coupons",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("code", sa.String(length=32), nullable=False, unique=True, index=True),
        sa.Column("discount_percent", sa.Numeric(12, 2), nullable=False),
        sa.Column("max_discount_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("min_order_amount", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )

    op.add_column("orders", sa.Column("subtotal_amount", sa.Numeric(12, 2), nullable=True))
    op.add_column("orders", sa.Column("discount_amount", sa.Numeric(12, 2), nullable=False, server_default="0"))
    op.add_column("orders", sa.Column("coupon_code", sa.String(length=32), nullable=True))
    op.add_column("orders", sa.Column("payment_method", sa.String(length=32), nullable=False, server_default="card"))
    op.add_column("orders", sa.Column("receipt_number", sa.String(length=64), nullable=True))

    op.create_index("ix_orders_receipt_number", "orders", ["receipt_number"], unique=True)
    op.execute("UPDATE orders SET subtotal_amount = total_amount")

    # Seed default promo codes for testing
    op.execute(
        """
        INSERT INTO coupons (code, discount_percent, max_discount_amount, min_order_amount, is_active)
        VALUES
            ('SHOPPILOT10', 10.0, 50.0, 25.0, true),
            ('AI20', 20.0, 100.0, 100.0, true)
        """
    )


def downgrade() -> None:
    op.drop_index("ix_orders_receipt_number", table_name="orders")
    op.drop_column("orders", "receipt_number")
    op.drop_column("orders", "payment_method")
    op.drop_column("orders", "coupon_code")
    op.drop_column("orders", "discount_amount")
    op.drop_column("orders", "subtotal_amount")
    op.drop_table("coupons")

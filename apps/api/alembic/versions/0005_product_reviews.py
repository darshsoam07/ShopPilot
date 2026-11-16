"""add verified product reviews table

Revision ID: 0005_product_reviews
Revises: 0004_catalog_metadata
Create Date: 2026-11-16
"""
from alembic import op
import sqlalchemy as sa

revision = "0005_product_reviews"
down_revision = "0004_catalog_metadata"  # Update if your 0003 revision ID differs
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "product_reviews",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "product_id",
            sa.Integer(),
            sa.ForeignKey("products.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=120), nullable=False),
        sa.Column("comment", sa.Text(), nullable=False),
        sa.Column(
            "is_verified_purchase",
            sa.Boolean(),
            nullable=False,
            server_default=sa.text("true"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint("product_id", "user_id", name="uq_product_user_review"),
    )


def downgrade() -> None:
    op.drop_table("product_reviews")

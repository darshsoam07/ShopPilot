"""Catalogue metadata and delivery fees."""
import sqlalchemy as sa
from alembic import op

revision = "0004_catalog_metadata"
down_revision = "0003_checkout_and_coupons"
branch_labels = depends_on = None


def upgrade():
    op.add_column("products", sa.Column("family", sa.String(100)))
    op.add_column("products", sa.Column("category", sa.String(80), nullable=False, server_default="Collection"))
    op.add_column("products", sa.Column("brand", sa.String(100)))
    op.add_column("products", sa.Column("rating", sa.Numeric(2, 1)))
    op.add_column("products", sa.Column("review_count", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("products", sa.Column("gallery_images", sa.JSON(), nullable=False, server_default="[]"))
    op.add_column("products", sa.Column("specifications", sa.JSON(), nullable=False, server_default="{}"))
    op.add_column("orders", sa.Column("shipping_cost", sa.Numeric(12, 2), nullable=False, server_default="0"))
    for prefix, category in [("LAP", "Workstation"), ("AUD", "Audio"), ("WAT", "Wearables")]:
        op.execute(sa.text("UPDATE products SET category=:category WHERE sku LIKE :sku").bindparams(category=category, sku=prefix+"-%"))


def downgrade():
    op.drop_column("orders", "shipping_cost")
    for column in ("family", "specifications", "gallery_images", "review_count", "rating", "brand", "category"):
        op.drop_column("products", column)

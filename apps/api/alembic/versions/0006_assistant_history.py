"""Store account-owned assistant transcripts and catalogue snapshots."""
import sqlalchemy as sa
from alembic import op

revision = "0006_assistant_history"
down_revision = "0005_product_reviews"
branch_labels = depends_on = None


def upgrade():
    op.create_table("chat_sessions", sa.Column("id", sa.Integer(), primary_key=True),
                    sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True))
    op.create_table("chat_messages", sa.Column("id", sa.Integer(), primary_key=True),
                    sa.Column("session_id", sa.Integer(), sa.ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True),
                    sa.Column("role", sa.String(12), nullable=False), sa.Column("body", sa.JSON(), nullable=False))


def downgrade():
    op.drop_table("chat_messages")
    op.drop_table("chat_sessions")

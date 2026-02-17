"""Add favorite note link table

Revision ID: a1c4f7b9d2e3
Revises: 3b6f1a2d9c4e
Create Date: 2026-02-17 20:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a1c4f7b9d2e3"
down_revision: Union[str, Sequence[str], None] = "3b6f1a2d9c4e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "favorite_note_link",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("note_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["note_id"], ["note.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "note_id"),
    )
    op.create_index(
        op.f("ix_favorite_note_link_note_id"),
        "favorite_note_link",
        ["note_id"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_favorite_note_link_note_id"), table_name="favorite_note_link")
    op.drop_table("favorite_note_link")

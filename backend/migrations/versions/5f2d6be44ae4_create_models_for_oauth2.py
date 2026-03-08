"""create models for OAuth2

Revision ID: 5f2d6be44ae4
Revises: 05459ac874d1
Create Date: 2026-03-08 23:43:05.260936

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '5f2d6be44ae4'
down_revision: Union[str, Sequence[str], None] = '05459ac874d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass

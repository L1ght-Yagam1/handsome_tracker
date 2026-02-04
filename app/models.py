from app.schemas import NoteBase, UserBase
from sqlmodel import Field, Relationship
from datetime import datetime
from app.utils import get_datetime_utc
from sqlalchemy import DateTime


# User db model
class User(UserBase, table = True):
    id: int | None = Field(default=None, primary_key=True)
    hashed_password: str
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    notes: list["Note"] = Relationship(back_populates="owner", cascade_delete=True)

# Note db model
class Note(NoteBase, table = True):
    id: int | None = Field(default=None, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    owner_id: int = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    owner: User | None = Relationship(back_populates="notes")







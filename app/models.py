from app.schemas import NoteBase
from sqlmodel import Field
from datetime import datetime
from app.utils import get_datetime_utc
from sqlalchemy import DateTime


class Note(NoteBase, table = True):
    id: int | None = Field(default=None, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )




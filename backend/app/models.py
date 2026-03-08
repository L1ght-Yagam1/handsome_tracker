from datetime import datetime

from sqlalchemy import DateTime
from sqlmodel import Field, Relationship, SQLModel

from app.schemas import NoteBase, UserBase
from app.utils import get_datetime_utc


class FavoriteNoteLink(SQLModel, table=True):
    __tablename__ = "favorite_note_link"

    user_id: int = Field(foreign_key="user.id", primary_key=True, ondelete="CASCADE")
    note_id: int = Field(foreign_key="note.id", primary_key=True, ondelete="CASCADE")
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )


# User db model
class User(UserBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    hashed_password: str
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )

    notes: list["Note"] = Relationship(back_populates="owner", cascade_delete=True)
    auth_identities: list["AuthIdentity"] = Relationship(
        back_populates="user",
        cascade_delete=True,
    )
    local_credentials: "LocalCredentials" = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"uselist": False},
        cascade_delete=True,
    )
    favorite_notes: list["Note"] = Relationship(
        back_populates="favorited_by",
        link_model=FavoriteNoteLink,
    )
    refresh_tokens: list["RefreshToken"] = Relationship(
        back_populates="user",
        cascade_delete=True,
    )


# Note db model
class Note(NoteBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    owner_id: int = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")

    owner: User | None = Relationship(back_populates="notes")
    favorited_by: list[User] = Relationship(
        back_populates="favorite_notes",
        link_model=FavoriteNoteLink,
    )


class RefreshToken(SQLModel, table=True):
    __tablename__ = "refresh_token"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    token_hash: str = Field(index=True, nullable=False, max_length=64)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    expires_at: datetime = Field(sa_type=DateTime(timezone=True))  # type: ignore
    revoked_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))  # type: ignore

    user: User | None = Relationship(back_populates="refresh_tokens")


class EmailVerificationCode(SQLModel, table=True):
    __tablename__ = "email_verification_code"
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(index=True, nullable=False, max_length=255)
    code_hash: str = Field(max_length=255)
    used_at: datetime | None = Field(default=None, sa_type=DateTime(timezone=True))  # type: ignore
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    expires_at: datetime = Field(sa_type=DateTime(timezone=True))  # type: ignore

class AuthIdentity(SQLModel, table=True):
    __tablename__ = "auth_identity"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    provider: str = Field(nullable=False, max_length=100)
    provider_user_id: str = Field(nullable=False, max_length=255)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )

    user: User | None = Relationship(back_populates="auth_identities")

class LocalCredentials(SQLModel, table=True):
    __tablename__ = "local_credentials"

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", nullable=False, ondelete="CASCADE")
    password_hash: str = Field(nullable=False, max_length=255)

    user: User | None = Relationship(back_populates="local_credentials")

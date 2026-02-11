from sqlmodel import SQLModel, Field
from datetime import datetime
from pydantic import EmailStr
from pydantic import ConfigDict


class Token(SQLModel):
    access_token: str
    token_type: str


class TokenWithRefresh(Token):
    refresh_token: str


class RefreshTokenRequest(SQLModel):
    refresh_token: str


class LogoutRequest(SQLModel):
    refresh_token: str

# Common fields for Note
class NoteBase(SQLModel):
    title : str = Field(max_length=255)
    content: str = Field(max_length=1000)


# Clas for creating a Note
class NoteCreate(NoteBase):
    pass

# Fields for public representation of a Note
class NotePublic(NoteBase):
    id: int

    model_config = ConfigDict(from_attributes=True)

class NotesPublic(SQLModel):
    notes : list[NotePublic]
    count : int

# Class for updating a Note
class NoteUpdate(NoteBase):
    title: str | None = None
    content: str | None = None

# Common fields for User
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)

class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)

class UserPublic(UserBase):
    id: int
    created_at : datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class UsersPublic(SQLModel):
    users : list[UserPublic]
    count : int

class UserUpdate(UserBase):
    email: EmailStr | None = None
    is_active: bool | None = None
    is_superuser: bool | None = None
    full_name: str | None = None

class UserUpdateMe(SQLModel):
    email: EmailStr | None = None
    full_name: str | None = None

class UserReplace(SQLModel):
    email: EmailStr
    is_active: bool
    is_superuser: bool
    full_name: str | None

class UserChangePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)

class UserSetPassword(SQLModel):
    new_password: str = Field(min_length=8, max_length=128)

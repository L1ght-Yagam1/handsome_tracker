from sqlmodel import SQLModel, Field
from datetime import datetime
from pydantic import EmailStr

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

    class Config:
        from_attributes = True

class NotesPublic(NoteBase):
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

    class Config:
        from_attributes = True


class UsersPublic(SQLModel):
    users : list[UserPublic]
    count : int

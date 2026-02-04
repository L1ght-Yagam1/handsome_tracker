from sqlmodel import SQLModel, Field

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

# Class for updating a Note
class NoteUpdate(NoteBase):
    title: str | None = None
    content: str | None = None
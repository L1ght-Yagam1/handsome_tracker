from sqlmodel import SQLModel, Field


class NoteBase(SQLModel):
    title : str = Field(max_length=255)
    content: str = Field(max_length=1000)


class NoteCreate(NoteBase):
    pass


class NotePublic(NoteBase):
    id: int

    class Config:
        from_attributes = True

class NoteUpdate(NoteBase):
    title: str | None = None
    content: str | None = None
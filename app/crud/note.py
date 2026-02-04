from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Note
from app.schemas import NoteCreate, NoteUpdate
from sqlmodel import select
from app import models
from fastapi import HTTPException

async def create_note(session: AsyncSession, note_in: NoteCreate, user_id: int):
    db_note = Note.model_validate(note_in, update={"owner_id": user_id}) # Превращаем схему в модель таблицы
    session.add(db_note)

    await session.commit() # Сохраняем в базу
    await session.refresh(db_note) # Получаем сгенерированный ID
    return db_note

async def get_notes(session: AsyncSession):
    statement = select(models.Note)
    result = await session.execute(statement)
    notes = result.scalars().all()
    return notes

async def update_note(session: AsyncSession, note_id: int, note_in: NoteUpdate):
    db_note = await session.get(models.Note, note_id)
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    update_data = note_in.model_dump(exclude_unset=True)

    db_note.sqlmodel_update(update_data)

    session.add(db_note)
    await session.commit()
    await session.refresh(db_note)
    return db_note
    

async def delete_note(session: AsyncSession, note_id: int):
    db_note = await session.get(models.Note, note_id)
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    await session.delete(db_note)
    await session.commit()
    return db_note
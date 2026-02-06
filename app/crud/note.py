from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Note
from app.schemas import NoteCreate, NoteUpdate
from sqlmodel import select, func, col
from app import models
from app.schemas import NotesPublic

async def create_note(session: AsyncSession, note_in: NoteCreate, user_id: int):
    db_note = Note.model_validate(note_in, update={"owner_id": user_id}) # Превращаем схему в модель таблицы
    session.add(db_note)

    await session.commit() # Сохраняем в базу
    await session.refresh(db_note) # Получаем сгенерированный ID
    return db_note

async def get_note(session: AsyncSession, note_id: int, user_id: int):
    statement = select(models.Note).where(
        models.Note.id == note_id,
        models.Note.owner_id == user_id,
    )
    result = await session.execute(statement)
    return result.scalars().first()


async def get_notes(session: AsyncSession, user_id: int, skip: int = 0, limit: int = 100):
    count_statement = (
        select(func.count())
        .select_from(models.Note)
        .where(models.Note.owner_id == user_id)
    )
    count_result = await session.execute(count_statement)
    count = count_result.scalars().one()

    statement = (
        select(models.Note)
        .where(models.Note.owner_id == user_id)
        .order_by(col(models.Note.created_at).desc())
        .offset(skip)
        .limit(limit)
    )
    result = await session.execute(statement)
    notes = result.scalars().all()
    return NotesPublic(notes=notes, count=count)

async def update_note(session: AsyncSession, note_id: int, note_in: NoteUpdate | NoteCreate, user_id: int):
    db_note = await get_note(session, note_id=note_id, user_id=user_id)
    if not db_note:
        return None
    
    update_data = note_in.model_dump(exclude_unset=True)

    db_note.sqlmodel_update(update_data)

    session.add(db_note)
    await session.commit()
    await session.refresh(db_note)
    return db_note
    

async def delete_note(session: AsyncSession, note_id: int, user_id: int):
    db_note = await get_note(session, note_id=note_id, user_id=user_id)
    if db_note:
        await session.delete(db_note)
        await session.commit()
    return db_note
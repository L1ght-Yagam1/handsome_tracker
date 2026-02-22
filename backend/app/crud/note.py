from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, func, select

from app import models, schemas
from app.models import FavoriteNoteLink, Note
from app.schemas import NoteCreate, NotesPublic, NoteUpdate


def _serialize_note(note: Note, favorite_ids: set[int]) -> schemas.NotePublic:
    return schemas.NotePublic.model_validate(
        note,
        update={"is_favorite": note.id in favorite_ids},
    )


async def get_note_model(session: AsyncSession, note_id: int, user_id: int):
    statement = select(models.Note).where(
        models.Note.id == note_id,
        models.Note.owner_id == user_id,
    )
    result = await session.execute(statement)
    return result.scalars().first()


async def get_favorite_note_ids(
    session: AsyncSession,
    user_id: int,
    note_ids: list[int],
) -> set[int]:
    if not note_ids:
        return set()

    statement = select(FavoriteNoteLink.note_id).where(
        FavoriteNoteLink.user_id == user_id,
        FavoriteNoteLink.note_id.in_(note_ids),
    )
    result = await session.execute(statement)
    return set(result.scalars().all())


async def get_note_public(session: AsyncSession, note_id: int, user_id: int):
    db_note = await get_note_model(session, note_id=note_id, user_id=user_id)
    if not db_note:
        return None

    favorite_ids = await get_favorite_note_ids(
        session,
        user_id=user_id,
        note_ids=[db_note.id]
    )
    return _serialize_note(db_note, favorite_ids)


async def create_note(session: AsyncSession, note_in: NoteCreate, user_id: int):
    db_note = Note.model_validate(note_in, update={"owner_id": user_id})
    session.add(db_note)
    await session.commit()
    await session.refresh(db_note)

    return await get_note_public(session, note_id=db_note.id, user_id=user_id)


async def get_notes(
    session: AsyncSession,
    user_id: int,
    skip: int = 0,
    limit: int = 100
):
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

    favorite_ids = await get_favorite_note_ids(
        session,
        user_id=user_id,
        note_ids=[note.id for note in notes],
    )
    notes_public = [_serialize_note(note, favorite_ids) for note in notes]
    return NotesPublic(notes=notes_public, count=count)


async def update_note(
    session: AsyncSession,
    note_id: int,
    note_in: NoteUpdate | NoteCreate,
    user_id: int,
):
    db_note = await get_note_model(session, note_id=note_id, user_id=user_id)
    if not db_note:
        return None

    update_data = note_in.model_dump(exclude_unset=True)
    db_note.sqlmodel_update(update_data)

    session.add(db_note)
    await session.commit()
    await session.refresh(db_note)

    return await get_note_public(session, note_id=db_note.id, user_id=user_id)


async def delete_note(session: AsyncSession, note_id: int, user_id: int):
    db_note = await get_note_model(session, note_id=note_id, user_id=user_id)
    if not db_note:
        return None

    response_payload = await get_note_public(session, note_id=note_id, user_id=user_id)
    await session.delete(db_note)
    await session.commit()
    return response_payload


async def set_note_favorite(
    session: AsyncSession,
    note_id: int,
    user_id: int,
    is_favorite: bool,
):
    db_note = await get_note_model(session, note_id=note_id, user_id=user_id)
    if not db_note:
        return None

    existing_link = await session.get(FavoriteNoteLink, (user_id, note_id))

    if is_favorite and not existing_link:
        session.add(FavoriteNoteLink(user_id=user_id, note_id=note_id))
        await session.commit()
    elif not is_favorite and existing_link:
        await session.delete(existing_link)
        await session.commit()

    return await get_note_public(session, note_id=note_id, user_id=user_id)

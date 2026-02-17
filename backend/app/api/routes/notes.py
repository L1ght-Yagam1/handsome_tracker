from fastapi import APIRouter

from app import schemas
from app.api.deps import CurrentUserDep, SessionDep
from app.crud import note
from app.utils import get_or_404

router = APIRouter(
    prefix="/notes",
    tags=["notes"],
)


@router.post("/", response_model=schemas.NotePublic)
async def create_note(
    note_in: schemas.NoteCreate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    db_note = await note.create_note(db, note_in, current_user.id)
    return get_or_404(db_note, "Note")


@router.get("/", response_model=schemas.NotesPublic)
async def read_notes(
    db: SessionDep,
    current_user: CurrentUserDep,
    skip: int = 0,
    limit: int = 100,
):
    return await note.get_notes(db, user_id=current_user.id, skip=skip, limit=limit)


@router.post("/{note_id}/favorite", response_model=schemas.NotePublic)
async def favorite_note(
    note_id: int,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    db_note = await note.set_note_favorite(
        db,
        note_id=note_id,
        user_id=current_user.id,
        is_favorite=True,
    )
    return get_or_404(db_note, "Note")


@router.delete("/{note_id}/favorite", response_model=schemas.NotePublic)
async def unfavorite_note(
    note_id: int,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    db_note = await note.set_note_favorite(
        db,
        note_id=note_id,
        user_id=current_user.id,
        is_favorite=False,
    )
    return get_or_404(db_note, "Note")


@router.get("/{note_id}", response_model=schemas.NotePublic)
async def read_note(
    note_id: int,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    db_note = await note.get_note_public(db, note_id=note_id, user_id=current_user.id)
    return get_or_404(db_note, "Note")


@router.patch("/{note_id}", response_model=schemas.NotePublic)
async def patch_note(
    note_id: int,
    note_in: schemas.NoteUpdate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    db_note = await note.update_note(db, note_id, note_in, user_id=current_user.id)
    return get_or_404(db_note, "Note")


@router.put("/{note_id}", response_model=schemas.NotePublic)
async def replace_note(
    note_id: int,
    note_in: schemas.NoteCreate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    db_note = await note.update_note(db, note_id, note_in, user_id=current_user.id)
    return get_or_404(db_note, "Note")


@router.delete("/{note_id}", response_model=schemas.NotePublic)
async def delete_note(
    note_id: int,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    db_note = await note.delete_note(db, note_id, user_id=current_user.id)
    return get_or_404(db_note, "Note")

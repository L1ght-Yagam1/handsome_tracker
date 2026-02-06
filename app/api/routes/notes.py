from fastapi import APIRouter, HTTPException
from app import schemas
from app.crud import note
from app.api.deps import CurrentUserDep, SessionDep

router = APIRouter(
    prefix="/notes",
    tags=["notes"]
)


@router.post("/", response_model=schemas.NotePublic)
async def create_note(
    note_in: schemas.NoteCreate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    return await note.create_note(db, note_in, current_user.id)

@router.get("/", response_model=schemas.NotesPublic)
async def read_notes(
    db: SessionDep,
    current_user: CurrentUserDep,
    skip: int = 0,
    limit: int = 100,
):
    return await note.get_notes(db, user_id=current_user.id, skip=skip, limit=limit)


@router.get("/{note_id}", response_model=schemas.NotePublic)
async def read_note(
    note_id: int,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    db_note = await note.get_note(db, note_id=note_id, user_id=current_user.id)
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    return db_note

@router.patch("/{note_id}", response_model=schemas.NotePublic)
async def patch_note(
    note_id: int,
    note_in: schemas.NoteUpdate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    db_note = await note.update_note(db, note_id, note_in, user_id=current_user.id)
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    return db_note

@router.put("/{note_id}", response_model=schemas.NotePublic)
async def replace_note(
    note_id: int,
    note_in: schemas.NoteCreate,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    db_note = await note.update_note(db, note_id, note_in, user_id=current_user.id)
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    return db_note

@router.delete("/{note_id}", response_model=schemas.NotePublic)
async def delete_note(
    note_id: int,
    db: SessionDep,
    current_user: CurrentUserDep,
):
    db_note = await note.delete_note(db, note_id, user_id=current_user.id)
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    return db_note
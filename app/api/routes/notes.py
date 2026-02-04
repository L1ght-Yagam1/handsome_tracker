from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app import database, schemas
from app.crud import note
from typing import List

router = APIRouter(
    prefix="/notes",
    tags=["notes"]
)


@router.post("/", response_model=schemas.NotePublic)
async def create_note(
    note_in: schemas.NoteCreate,
    db: AsyncSession = Depends(database.get_db)
):
    return await note.create_note(db, note_in, 1)

@router.get("/", response_model=List[schemas.NotePublic])
async def read_notes(db: AsyncSession = Depends(database.get_db)):
    notes = await note.get_notes(db)
    return notes

@router.patch("/{note_id}", response_model=schemas.NotePublic)
async def patch_note(
    note_id: int,
    note_in: schemas.NoteUpdate,
    db: AsyncSession = Depends(database.get_db)
):
    db_note = await note.update_note(db, note_id, note_in)
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    return db_note

@router.put("/{note_id}", response_model=schemas.NotePublic)
async def replace_note(
    note_id: int,
    note_in: schemas.NoteCreate,
    db: AsyncSession = Depends(database.get_db)
):
    db_note = await note.update_note(db, note_id, note_in)
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    return db_note

@router.delete("/{note_id}", response_model=schemas.NotePublic)
async def delete_note(
    note_id: int,
    db: AsyncSession = Depends(database.get_db)
):
    db_note = await note.delete_note(db, note_id)
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    return db_note
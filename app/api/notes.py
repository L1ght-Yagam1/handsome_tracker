from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import database, schemas
from app import crud
from typing import List
from app import models
from sqlmodel import select

router = APIRouter(
    prefix="/notes",
    tags=["notes"]
)


@router.post("/", response_model=schemas.NotePublic)
async def create_note(
    note_in: schemas.NoteCreate,
    db: Session = Depends(database.get_db)
):
    return await crud.create_note(db, note_in)

@router.get("/", response_model=List[schemas.NotePublic])
async def read_notes(db: Session = Depends(database.get_db)):
    notes = await crud.get_notes(db)
    return notes

@router.patch("/{note_id}", response_model=schemas.NotePublic)
async def patch_note(
    note_id: int,
    note_in: schemas.NoteUpdate,
    db: Session = Depends(database.get_db)
):
    db_note = await crud.update_note(db, note_id, note_in)
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    return db_note

@router.put("/{note_id}", response_model=schemas.NotePublic)
async def replace_note(
    note_id: int,
    note_in: schemas.NoteCreate,
    db: Session = Depends(database.get_db)
):
    db_note = await crud.update_note(db, note_id, note_in)
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    return db_note

@router.delete("/{note_id}", response_model=schemas.NotePublic)
async def delete_note(
    note_id: int,
    db: Session = Depends(database.get_db)
):
    db_note = await crud.delete_note(db, note_id)
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    return db_note
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud import user
from app import database, schemas


router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.post("/", response_model=schemas.UserPublic)
async def create_user(
    user_in: schemas.UserCreate,
    db: AsyncSession = Depends(database.get_db)
):
    return await user.create_user(db, user_in)

@router.get("/{user_id}", response_model=schemas.UserPublic)
async def read_user(
    user_id: int,
    db: AsyncSession = Depends(database.get_db)
):
    db_user = await user.get_current_user(user_id, db)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user


@router.get("/", response_model=schemas.UsersPublic)
async def read_users(db: AsyncSession = Depends(database.get_db), skip: int = 0, limit: int = 100):
    return await user.get_users(db, skip=skip, limit=limit)
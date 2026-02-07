from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud import user
from app import schemas
from app.api.deps import SessionDep, AdminDep, CurrentUserDep

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.patch("/me", response_model=schemas.UserPublic)
async def patch_current_user(
    user_in: schemas.UserUpdate,
    db: SessionDep,
    current_user: CurrentUserDep # Используйте вашу зависимость для получения текущего юзера
):
    # Теперь мы берем ID прямо из объекта авторизованного пользователя
    db_user = await user.update_user(db, current_user.id, user_in)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.post("/", response_model=schemas.UserPublic, status_code=201)
async def create_user_account(
    user_creation_params: schemas.UserCreate,
    db_session: SessionDep,
    admin: AdminDep
    ):
    return await user.create_user(db_session, user_creation_params)

@router.get("/{user_id}", response_model=schemas.UserPublic)
async def read_user(
    user_id: int,
    db: SessionDep,
    admin: AdminDep
):
    db_user = await user.get_current_user(user_id, db)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.get("/", response_model=schemas.UsersPublic)
async def read_users(db: SessionDep, admin: AdminDep, skip: int = 0, limit: int = 100):
    return await user.get_users(db, skip=skip, limit=limit)

@router.patch("/{user_id}", response_model=schemas.UserPublic)
async def patch_user(
    user_id: int,
    user_in: schemas.UserUpdate,
    db: SessionDep,
    admin: AdminDep
):
    db_user = await user.update_user(db, user_id, user_in)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.put("/{user_id}", response_model=schemas.UserPublic)
async def replace_user(
    user_id: int,
    user_in: schemas.UserUpdate,
    db: SessionDep,
    admin: AdminDep
):
    db_user = await user.update_user(db, user_id, user_in)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.delete("/{user_id}", response_model=schemas.UserPublic)
async def delete_user(
    user_id: int,
    db: SessionDep,
    admin: AdminDep
):
    deleted_user = await user.delete_user(db, user_id)
    if not deleted_user:
        raise HTTPException(status_code=404, detail="User not found")
    return deleted_user
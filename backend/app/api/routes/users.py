from fastapi import APIRouter, HTTPException
from app.crud import note, user
from app import schemas
from app.api.deps import SessionDep, AdminDep, CurrentUserDep
from app.utils import get_or_404

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.patch("/me", response_model=schemas.UserPublic)
async def patch_current_user(
    user_in: schemas.UserUpdateMe,
    db: SessionDep,
    current_user: CurrentUserDep
):
    db_user = await user.update_user(db, current_user.id, user_in)
    return get_or_404(db_user, "User")

@router.patch("/me/password", response_model=schemas.UserPublic)
async def change_my_password(
    payload: schemas.UserChangePassword,
    db: SessionDep,
    current_user: CurrentUserDep
):
    try:
        db_user = await user.change_password_for_user(
            db, current_user.id, payload.current_password, payload.new_password
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    return get_or_404(db_user, "User")

@router.post("/", response_model=schemas.UserPublic, status_code=201)
async def create_user_account(
    user_creation_params: schemas.UserCreate,
    db: SessionDep,
    _admin: AdminDep
    ):
    return await user.create_user(db, user_creation_params)

@router.get("/{user_id}", response_model=schemas.UserPublic)
async def read_user(
    user_id: int,
    db: SessionDep,
    _admin: AdminDep
):
    db_user = await user.get_user_by_id(user_id, db)
    return get_or_404(db_user, "User")

@router.get("/{user_id}/notes", response_model=schemas.NotesPublic)
async def read_user_notes(
    user_id: int,
    db: SessionDep,
    _admin: AdminDep,
    skip: int = 0,
    limit: int = 100,
):
    return await note.get_notes(db, user_id=user_id, skip=skip, limit=limit)

@router.get("/", response_model=schemas.UsersPublic)
async def read_users(db: SessionDep, _admin: AdminDep, skip: int = 0, limit: int = 100):
    return await user.get_users(db, skip=skip, limit=limit)

@router.patch("/{user_id}", response_model=schemas.UserPublic)
async def patch_user(
    user_id: int,
    user_in: schemas.UserUpdate,
    db: SessionDep,
    _admin: AdminDep
):
    db_user = await user.update_user(db, user_id, user_in)
    return get_or_404(db_user, "User")

@router.patch("/{user_id}/password", response_model=schemas.UserPublic)
async def set_user_password(
    user_id: int,
    payload: schemas.UserSetPassword,
    db: SessionDep,
    _admin: AdminDep
):
    db_user = await user.set_password_for_user(db, user_id, payload.new_password)
    return get_or_404(db_user, "User")

@router.put("/{user_id}", response_model=schemas.UserPublic)
async def replace_user(
    user_id: int,
    user_in: schemas.UserReplace,
    db: SessionDep,
    _admin: AdminDep
):
    db_user = await user.replace_user(db, user_id, user_in)
    return get_or_404(db_user, "User")

@router.delete("/{user_id}", response_model=schemas.UserPublic)
async def delete_user(
    user_id: int,
    db: SessionDep,
    _admin: AdminDep
):
    deleted_user = await user.delete_user(db, user_id)
    return get_or_404(deleted_user, "User")

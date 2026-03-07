from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app import schemas
from app.api.deps import SessionDep
from app.core.config import settings
from app.core.security import create_access_token, generate_refresh_token, hash_token
from app.crud import refresh_token as refresh_token_crud
from app.crud import user
from app.utils import get_datetime_utc

router = APIRouter(prefix="/login", tags=["login"])


@router.post("/access-token", response_model=schemas.TokenWithRefresh)
async def login_access_token(
    db: SessionDep,
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    db_user = await user.authenticate_user(
        db, email=form_data.username,
        password=form_data.password
    )

    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=db_user.id)

    refresh_token = generate_refresh_token()
    refresh_token_hash = hash_token(refresh_token)
    refresh_expires = get_datetime_utc() \
          + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    await refresh_token_crud.create_refresh_token(
        db,
        user_id=db_user.id,
        token_hash=refresh_token_hash,
        expires_at=refresh_expires,
    )

    return schemas.TokenWithRefresh(
        access_token=access_token,
        token_type="bearer",
        refresh_token=refresh_token,
    )


@router.post("/refresh-token", response_model=schemas.TokenWithRefresh)
async def refresh_access_token(
    payload: schemas.RefreshTokenRequest,
    db: SessionDep,
):
    refresh_token_hash = hash_token(payload.refresh_token)
    rotated = await refresh_token_crud.rotate_refresh_token(db, refresh_token_hash)
    if not rotated:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token already used or invalid"
        )

    access_token = create_access_token(subject=rotated["user_id"])
    
    return schemas.TokenWithRefresh(
        access_token=access_token,
        token_type="bearer",
        refresh_token=rotated["refresh_token"],
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    payload: schemas.LogoutRequest,
    db: SessionDep,
):
    refresh_token_hash = hash_token(payload.refresh_token)
    
    db_token = await refresh_token_crud.get_refresh_token_by_hash(
        db,
        refresh_token_hash
    )
    if db_token:
        await refresh_token_crud.revoke_refresh_token(db, db_token)
    return None

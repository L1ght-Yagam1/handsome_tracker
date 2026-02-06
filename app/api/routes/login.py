from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app import schemas
from app.api.deps import SessionDep
from app.core.security import create_access_token
from app.crud import user


router = APIRouter(prefix="/login", tags=["login"])


@router.post("/access-token", response_model=schemas.Token)
async def login_access_token(
    db: SessionDep,
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    db_user = await user.authenticate_user(db, email=form_data.username, password=form_data.password)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=db_user.id)
    return schemas.Token(access_token=access_token, token_type="bearer")

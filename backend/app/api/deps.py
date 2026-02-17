from collections.abc import AsyncGenerator
from typing import Annotated

import jwt
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import async_session
from fastapi import Depends, HTTPException, status

from fastapi.security import OAuth2PasswordBearer

from app.core.security import decode_access_token
from app.crud import user
from app.models import User

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"/login/access-token"
)

def raise_invalid_credentials() -> None:
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session

SessionDep = Annotated[AsyncSession, Depends(get_db)]
TokenDep = Annotated[str, Depends(reusable_oauth2)]

async def get_current_user(db: SessionDep, token: TokenDep) -> User:
    try:
        payload = decode_access_token(token)
        subject = payload.get("sub")
        if subject is None:
            raise_invalid_credentials()
        user_id = int(subject)
    except (jwt.PyJWTError, ValueError):
        raise_invalid_credentials()

    db_user = await user.get_user_by_id(user_id, db)
    if not db_user:
        raise_invalid_credentials()
    return db_user

CurrentUserDep = Annotated[User, Depends(get_current_user)]

async def get_current_active_superuser(current_user: CurrentUserDep) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="The user doesn't have enough privileges"
        )
    return current_user

AdminDep = Annotated[User, Depends(get_current_active_superuser)]

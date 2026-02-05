from collections.abc import AsyncGenerator
from typing import Annotated

from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import engine
from fastapi import Depends, HTTPException, status

from fastapi.security import OAuth2PasswordBearer

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"/login/access-token"
)

async def get_db() -> AsyncGenerator[AsyncSession, None, None]:
    async with AsyncSession(engine) as session:
        yield session

SessionDep = Annotated[AsyncSession, Depends(get_db)]
TokenDep = Annotated[str, Depends(reusable_oauth2)]
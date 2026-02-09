from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models import RefreshToken
from app.utils import get_datetime_utc


async def create_refresh_token(
    session: AsyncSession,
    user_id: int,
    token_hash: str,
    expires_at: datetime,
):
    db_token = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
    )
    session.add(db_token)
    await session.commit()
    await session.refresh(db_token)
    return db_token


async def get_refresh_token_by_hash(session: AsyncSession, token_hash: str):
    statement = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    result = await session.execute(statement)
    return result.scalars().first()


async def revoke_refresh_token(session: AsyncSession, db_token: RefreshToken):
    if db_token.revoked_at is None:
        db_token.revoked_at = get_datetime_utc()
        session.add(db_token)
        await session.commit()
        await session.refresh(db_token)
    return db_token

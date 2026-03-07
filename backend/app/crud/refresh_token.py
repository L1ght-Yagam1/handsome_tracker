from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, update

from app.models import RefreshToken
from app.utils import get_datetime_utc
from app.core.security import generate_refresh_token, hash_token
from app.core.config import settings


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

async def rotate_refresh_token(session: AsyncSession, token_hash: str):
    now = get_datetime_utc()

    async with session.begin():
        statement = (
            update(RefreshToken)
            .where(
                RefreshToken.token_hash == token_hash, 
                RefreshToken.revoked_at.is_(None),
                RefreshToken.expires_at > now,
            )
            .values(revoked_at=now)
            .returning(RefreshToken)
        )

        result = await session.execute(statement)
        consumed_token = result.scalar_one_or_none()

        if consumed_token is None:
            return None

        raw_refresh_token = generate_refresh_token()
        new_db_token = RefreshToken(
                user_id=consumed_token.user_id,
                token_hash=hash_token(raw_refresh_token),
                expires_at=now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            )
        session.add(new_db_token)

    return {
        "user_id": consumed_token.user_id,
        "refresh_token": raw_refresh_token,
    }

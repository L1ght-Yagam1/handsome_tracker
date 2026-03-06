from app.models import EmailVerificationCode
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, desc


async def save_code(session: AsyncSession, email: str, code_hash: str, created_at: datetime, expires_at: datetime):
    ver_code = EmailVerificationCode(
        email=email,
        code_hash=code_hash,
        created_at=created_at,
        expires_at=expires_at
    )
    session.add(ver_code)
    await session.commit()

async def get_code(session: AsyncSession, email: str):
    code_hash = await session.execute(
        select(EmailVerificationCode.code_hash).where(EmailVerificationCode.email == email).order_by(desc(EmailVerificationCode.created_at)).limit(1)
    )
    return code_hash.scalar_one_or_none()
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import select

from app.core.config import settings
from app.crud.user import create_user
from app.models import User
from app.schemas import UserCreate

engine = create_async_engine(str(settings.SQLALCHEMY_DATABASE_URI))
async_session = async_sessionmaker(
    engine, expire_on_commit=False, autoflush=False, autocommit=False
)



async def init_db(session: AsyncSession) -> None:
    # Tables should be created with Alembic migrations
    # But if you don't want to use migrations, create
    # the tables un-commenting the next lines
    # from sqlmodel import SQLModel

    # This works because the models are already imported and registered from app.models
    # SQLModel.metadata.create_all(engine)

    result = await session.execute(
        select(User).where(User.email == settings.FIRST_SUPERUSER)
    )
    user = result.scalars().first()
    if not user:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
        )
        user = await create_user(session=session, user_in=user_in)

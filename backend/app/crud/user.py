from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, func, select

from app import models
from app.models import User
from app.schemas import UserCreate, UserReplace, UsersPublic, UserUpdate, UserUpdateMe
from app.utils import get_password_hash, verify_password


async def create_user(session: AsyncSession, user_in: UserCreate):
    db_user = User.model_validate(
        user_in, update={"hashed_password": get_password_hash(user_in.password)}
    ) # Превращаем схему в модель таблицы
    session.add(db_user)
    await session.commit()
    await session.refresh(db_user)
    return db_user

async def get_user_by_id(user_id: int, db: AsyncSession):
    db_user = await db.get(models.User, user_id)
    if not db_user:
        return None
    return db_user

async def get_user_by_email(db: AsyncSession, email: str):
    statement = select(models.User).where(models.User.email == email)
    result = await db.execute(statement)
    return result.scalars().first()

async def authenticate_user(session: AsyncSession, email: str, password: str):
    db_user = await get_user_by_email(session, email=email)
    if not db_user:
        return None
    if not verify_password(password, db_user.hashed_password):
        return None
    return db_user

async def get_users(session: AsyncSession, skip: int = 0, limit: int = 100):
    # 1. Считаем количество
    count_statement = select(func.count()).select_from(User)
    count_result = await session.execute(count_statement)
    count = count_result.scalars().one()

    # 2. Получаем список
    statement = (
        select(User).order_by(col(User.created_at).desc()).offset(skip).limit(limit)
    )
    users_result = await session.execute(statement)
    users_list = users_result.scalars().all()

    return UsersPublic(users=users_list, count=count)

async def update_user(
    session: AsyncSession,
    user_id: int,
    user_in: UserUpdate | UserUpdateMe
):
    db_user = await get_user_by_id(user_id, session)
    if not db_user:
        return None
    
    update_data = user_in.model_dump(exclude_unset=True)

    db_user.sqlmodel_update(update_data)

    session.add(db_user)
    await session.commit()
    await session.refresh(db_user)
    return db_user

async def replace_user(
    session: AsyncSession,
    user_id: int,
    user_in: UserReplace
):
    db_user = await get_user_by_id(user_id, session)
    if not db_user:
        return None

    update_data = user_in.model_dump(exclude_unset=False)

    db_user.sqlmodel_update(update_data)

    session.add(db_user)
    await session.commit()
    await session.refresh(db_user)
    return db_user

async def change_password_for_user(
    session: AsyncSession,
    user_id: int,
    current_password: str,
    new_password: str
):
    db_user = await get_user_by_id(user_id, session)
    if not db_user:
        return None

    if not verify_password(current_password, db_user.hashed_password):
        raise ValueError("current_password_incorrect")

    db_user.hashed_password = get_password_hash(new_password)
    session.add(db_user)
    await session.commit()
    await session.refresh(db_user)
    return db_user

async def set_password_for_user(
    session: AsyncSession,
    user_id: int,
    new_password: str
):
    db_user = await get_user_by_id(user_id, session)
    if not db_user:
        return None

    db_user.hashed_password = get_password_hash(new_password)
    session.add(db_user)
    await session.commit()
    await session.refresh(db_user)
    return db_user

async def delete_user(session: AsyncSession, user_id: int):
    db_user = await get_user_by_id(user_id, session)
    if not db_user:
        return None
    
    await session.delete(db_user)
    await session.commit()
    return db_user

from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User
from app.schemas import UserCreate, UsersPublic, UserUpdate
from sqlmodel import select, func, col
from app.utils import get_password_hash
from app import models
from fastapi import HTTPException

async def create_user(session: AsyncSession, user_in: UserCreate):
    db_user = User.model_validate(user_in, update={"hashed_password": get_password_hash(user_in.password)}) # Превращаем схему в модель таблицы
    session.add(db_user)
    await session.commit()
    await session.refresh(db_user)
    return db_user

async def get_current_user(id: int, db: AsyncSession):
    # В асинхронности используем await db.exec(...)
    statement = select(User).where(User.id == id)
    result = await db.execute(statement)
    return result.scalars().first()

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

async def update_user(session: AsyncSession, user_id: int, user_in: UserUpdate):
    db_user = await session.get(models.User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user_in.model_dump(exclude_unset=True)

    if "password" in update_data:
        hashed_password = get_password_hash(update_data["password"])
        update_data["hashed_password"] = hashed_password
        del update_data["password"]

    db_user.sqlmodel_update(update_data)

    session.add(db_user)
    await session.commit()
    await session.refresh(db_user)
    return db_user

async def delete_user(session: AsyncSession, user_id: int):
    db_user = await session.get(models.User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await session.delete(db_user)
    await session.commit()
    return db_user
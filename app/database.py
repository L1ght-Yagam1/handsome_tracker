from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

# Ссылка Docker-контейнер
SQLALCHEMY_DATABASE_URL = "postgresql+psycopg://postgres:masterkey@localhost:5432/postgres"

engine = create_async_engine(SQLALCHEMY_DATABASE_URL)
async_session_maker = async_sessionmaker(engine, expire_on_commit=False)

async def get_db():
    async with async_session_maker() as session:
        yield session  # Отдает сессию и закроет её после обработки запроса
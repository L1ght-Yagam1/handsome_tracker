import asyncio

from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlmodel import SQLModel

from app.api.deps import get_db
import app.models  # ensure models are registered
from app.crud.user import create_user
from app.main import app
from app.schemas import UserCreate


TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"
test_engine = create_async_engine(TEST_DATABASE_URL, future=True)


async def init_models() -> None:
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
        await conn.run_sync(SQLModel.metadata.create_all)


def override_get_db():
    async def _get_db():
        async with AsyncSession(test_engine) as session:
            yield session

    return _get_db


def run_async(coro):
    return asyncio.run(coro)


def create_user_in_db(email: str, password: str, is_superuser: bool = False):
    async def _create():
        async with AsyncSession(test_engine) as session:
            user_in = UserCreate(
                email=email,
                password=password,
                is_superuser=is_superuser,
            )
            return await create_user(session=session, user_in=user_in)

    return run_async(_create())


def login(client: TestClient, email: str, password: str):
    return client.post(
        "/login/access-token",
        data={"username": email, "password": password},
    )


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def setup_module():
    run_async(init_models())
    app.dependency_overrides[get_db] = override_get_db()


def teardown_module():
    app.dependency_overrides.clear()
    run_async(init_models())


client = TestClient(app)


def test_login_refresh_logout_flow():
    create_user_in_db("user1@example.com", "password123")
    resp = login(client, "user1@example.com", "password123")
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert "refresh_token" in body

    refresh = body["refresh_token"]
    resp = client.post("/login/refresh-token", json={"refresh_token": refresh})
    assert resp.status_code == 200
    body2 = resp.json()
    assert body2["refresh_token"] != refresh

    # Old refresh token should be revoked after rotation
    resp = client.post("/login/refresh-token", json={"refresh_token": refresh})
    assert resp.status_code == 401

    # Logout revokes current refresh token
    resp = client.post("/login/logout", json={"refresh_token": body2["refresh_token"]})
    assert resp.status_code == 204
    resp = client.post("/login/refresh-token", json={"refresh_token": body2["refresh_token"]})
    assert resp.status_code == 401


def test_notes_scoped_to_current_user():
    create_user_in_db("notes1@example.com", "password123")
    create_user_in_db("notes2@example.com", "password123")

    token1 = login(client, "notes1@example.com", "password123").json()["access_token"]
    token2 = login(client, "notes2@example.com", "password123").json()["access_token"]

    resp = client.post(
        "/notes/",
        json={"title": "u1 note", "content": "u1 content"},
        headers=auth_headers(token1),
    )
    assert resp.status_code == 200

    resp = client.post(
        "/notes/",
        json={"title": "u2 note", "content": "u2 content"},
        headers=auth_headers(token2),
    )
    assert resp.status_code == 200

    resp = client.get("/notes/", headers=auth_headers(token1))
    assert resp.status_code == 200
    data = resp.json()
    assert data["count"] == 1
    assert len(data["notes"]) == 1
    assert data["notes"][0]["title"] == "u1 note"


def test_admin_can_access_user_notes_and_users_route():
    create_user_in_db("admin@example.com", "password123", is_superuser=True)
    user = create_user_in_db("regular@example.com", "password123")

    admin_token = login(client, "admin@example.com", "password123").json()["access_token"]
    user_token = login(client, "regular@example.com", "password123").json()["access_token"]

    # create a note for the regular user
    resp = client.post(
        "/notes/",
        json={"title": "user note", "content": "user content"},
        headers=auth_headers(user_token),
    )
    assert resp.status_code == 200

    # admin can read user notes
    resp = client.get(f"/users/{user.id}/notes", headers=auth_headers(admin_token))
    assert resp.status_code == 200
    data = resp.json()
    assert data["count"] == 1

    # regular user cannot access admin routes
    resp = client.get("/users", headers=auth_headers(user_token))
    assert resp.status_code == 403
    resp = client.get(f"/users/{user.id}/notes", headers=auth_headers(user_token))
    assert resp.status_code == 403

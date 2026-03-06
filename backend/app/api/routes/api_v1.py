from fastapi import APIRouter
from app.api.routes import auth_router, notes, users
from app.core.config import settings


router = APIRouter(prefix=settings.API_V1_STR)

router.include_router(auth_router.router)
router.include_router(notes.router)
router.include_router(users.router)

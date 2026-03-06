from fastapi import APIRouter
from app.api.routes import login, register



router = APIRouter(prefix="/auth")

router.include_router(login.router)
router.include_router(register.router)

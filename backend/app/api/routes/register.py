from fastapi import APIRouter
from app.schemas import UserRegistation, UserPublic, RegisterSendCodeRequest
from fastapi import HTTPException
from app.services import register_service
from app.api.deps import SessionDep
from fastapi import BackgroundTasks


router = APIRouter(prefix="/register", tags=["register"])

@router.post("/", response_model=UserPublic)
async def register_user(
    payload: UserRegistation,
    db: SessionDep
):
    try:
        return await register_service.register_user(db, payload)
    except register_service.UserAlreadyExistsError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except register_service.CodeNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/send-code")
async def send_code(
    payload: RegisterSendCodeRequest,
    db: SessionDep,
    background_tasks: BackgroundTasks,
):
    try:
        return await register_service.prepare_verification_code(db, payload.email, background_tasks)
    except register_service.InvalidVerificationCodeError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


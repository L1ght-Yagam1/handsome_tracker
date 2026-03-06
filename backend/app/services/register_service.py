import secrets
from datetime import timedelta

from app import schemas
from app.crud import user as user_crud
from app.services.exceptions import UserAlreadyExistsError, InvalidVerificationCodeError
from app.services.email_service import send_verification_code_email
from app.crud.email_verification import save_code, get_code
from app.core.security import hash_verification_code
from app.utils import get_datetime_utc
from app.core.config import settings

def generate_verification_code(length: int = 6) -> str:
    if length <= 0:
        raise ValueError("length must be positive")
    return f"{secrets.randbelow(10**length):0{length}d}"

async def register_user(db, payload: schemas.UserRegistation):
    user = await user_crud.get_user_by_email(db, payload.email)
    if user:
        raise UserAlreadyExistsError("User with this email already exists")
    
    code_hash = hash_verification_code(payload.code)

    code_hash_db = await get_code(db, payload.email)

    if code_hash_db != code_hash:
        raise InvalidVerificationCodeError("Invalid verification code")

    
    
    user_in = schemas.UserCreate(
        email=payload.email,
        password=payload.password,
        full_name=payload.full_name,
        is_active=True,
        is_superuser=False,
    )

    return await user_crud.create_user(db, user_in)

async def prepare_verification_code(db, email, background_tasks):
    ver_code = generate_verification_code(6)

    code_hash = hash_verification_code(ver_code)

    expires_at = get_datetime_utc() + timedelta(
    minutes=settings.EMAIL_VERIFICATION_CODE_EXPIRE_MINUTES
)

    await save_code(db, email, code_hash, get_datetime_utc(), expires_at=expires_at)



    background_tasks.add_task(send_verification_code_email, email, ver_code)


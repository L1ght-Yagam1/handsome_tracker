from datetime import datetime, timezone

from fastapi import HTTPException
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher
from pwdlib.hashers.bcrypt import BcryptHasher
from email_validator import validate_email, EmailNotValidError

password_hash = PasswordHash(
    (
        Argon2Hasher(),
        BcryptHasher(),
    )
)


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)

def get_password_hash(password: str) -> str:
    return password_hash.hash(password)

# Проверка пароля
def verify_password(password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hashed password.

    :param password: The password to verify
    :param hashed_password: The hashed password to verify against
    :return: Whether the password is valid
    """
    return password_hash.verify(password, hashed_password)


def raise_not_found(entity: str = "Resource") -> None:
    raise HTTPException(status_code=404, detail=f"{entity} not found")


def get_or_404(value, entity: str = "Resource"):
    if value is None:
        raise_not_found(entity)
    return value

def validate_user_email(email: str) -> str:
    try:
        emailinfo = validate_email(email, check_deliverability=False)
        return emailinfo.normalized
    
    except EmailNotValidError as e:
        raise ValueError(str(e))
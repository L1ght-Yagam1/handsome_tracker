from datetime import datetime, timezone
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher
from pwdlib.hashers.bcrypt import BcryptHasher

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

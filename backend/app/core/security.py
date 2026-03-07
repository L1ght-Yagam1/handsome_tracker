import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any
import hmac

import jwt

from app.core.config import settings


def create_access_token(
    subject: str | int,
    expires_delta: timedelta | None = None
) -> str:
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    now = datetime.now(timezone.utc)
    expire = now + expires_delta
    to_encode: dict[str, Any] = {
        "exp": expire,
        "iat": now,
        "jti": secrets.token_hex(16),
        "sub": str(subject),
    }
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

def decode_access_token(token: str) -> dict[str, Any]:
    return jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.ALGORITHM],
        options={"require": ["exp", "sub"]},
    )

def generate_refresh_token() -> str:
    return secrets.token_urlsafe(32)

def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

def hash_verification_code(code: str) -> str:
    return hashlib.sha256(code.encode("utf-8")).hexdigest()

def generate_verification_code(length: int = 6) -> str:
    if length <= 0:
        raise ValueError("length must be positive")
    return f"{secrets.randbelow(10**length):0{length}d}"

def verify_verification_code(code: str, expected_hash: str) -> bool:
    return hmac.compare_digest(hash_verification_code(code), expected_hash)
import secrets

from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import RedirectResponse, JSONResponse
from app.core.config import settings
from urllib.parse import urlencode

router = APIRouter(prefix="/google", tags=["google"])


def build_google_auth_url(state: str) -> str:
    query = urlencode(
        {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
        }
    )
    return f"{settings.GOOGLE_AUTH_URL}?{query}"


@router.get("/login")
async def login_with_google(

):
    state = secrets.token_urlsafe(32)
    redirect = RedirectResponse(build_google_auth_url(state), status_code=302)

    redirect.set_cookie(
        key="oauth_state",
        value=state,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=600,
    )
    return redirect


@router.get("/callback")
async def google_callback(
    request: Request, 
    code: str | None = None, 
    state: str | None = None, 
    error: str | None = None,
    error_description: str | None = None,
) -> JSONResponse:
    expected_state = request.cookies.get("oauth_state")
    if not expected_state or not secrets.compare_digest(state, expected_state):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OAuth state",
        )
    
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"OAuth Google error: {error_description or error}",
        )
    
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing OAuth code",
        )

    response = JSONResponse(
        {
            "message": "State is valid",
            "authorization_code": code,
        }
    )
    response.delete_cookie("oauth_state")
    return response

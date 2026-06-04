import hmac

from fastapi import Header, HTTPException, status

from app.core.config import get_settings


async def require_service_token(x_service_token: str = Header(default="")) -> None:
    """Authenticate service-to-service calls from the Next.js web app.

    The API never authenticates end users (BetterAuth owns that); it only trusts
    the shared service token. Phase 1+ may upgrade this to signed short-lived JWTs.
    """
    expected = get_settings().service_token
    if not expected or not hmac.compare_digest(x_service_token, expected):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid service token")

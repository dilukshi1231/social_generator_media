from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx
import secrets
import urllib.parse
from datetime import datetime, timedelta

from app.core.config import settings
from app.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.social_account import SocialAccount, PlatformType


router = APIRouter()

# Simple in-memory state store for demo/dev; for production, persist per-user (e.g., Redis)
_oauth_state_store: dict[str, int] = {}


def _linkedin_redirect_uri() -> str:
    # Prefer explicit setting, else infer from BACKEND_URL
    base = (
        getattr(settings, "LINKEDIN_REDIRECT_URI", "")
        or f"{getattr(settings, 'BACKEND_URL', 'http://localhost:8000')}/api/v1/oauth/linkedin/callback"
    )
    return base


@router.get("/linkedin/authorize")
async def linkedin_authorize(current_user: User = Depends(get_current_user)):
    """Return a LinkedIn OAuth authorization URL."""
    client_id = settings.LINKEDIN_CLIENT_ID
    if not client_id:
        raise HTTPException(
            status_code=500, detail="LinkedIn OAuth not configured (client id missing)"
        )

    state = secrets.token_urlsafe(16)
    # Track which user initiated the flow
    _oauth_state_store[state] = current_user.id

    params = {
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": _linkedin_redirect_uri(),
        "scope": "openid profile email w_member_social",
        "state": state,
    }
    url = "https://www.linkedin.com/oauth/v2/authorization?" + urllib.parse.urlencode(
        params
    )
    return JSONResponse({"authorize_url": url})


@router.get("/linkedin/callback")
async def linkedin_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Handle LinkedIn OAuth callback: exchange code for token, fetch profile, store account, redirect to frontend."""
    frontend_redirect_base = settings.FRONTEND_URL or "http://localhost:3000"
    redirect_success = f"{frontend_redirect_base}/dashboard/social-accounts?connected=linkedin&status=success"
    redirect_error = f"{frontend_redirect_base}/dashboard/social-accounts?connected=linkedin&status=error"

    if error:
        return RedirectResponse(redirect_error)

    if not code or not state or state not in _oauth_state_store:
        return RedirectResponse(redirect_error)

    # Identify user who initiated
    user_id = _oauth_state_store.pop(state)

    client_id = settings.LINKEDIN_CLIENT_ID
    client_secret = settings.LINKEDIN_CLIENT_SECRET
    redirect_uri = _linkedin_redirect_uri()

    if not client_id or not client_secret:
        return RedirectResponse(redirect_error)

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Exchange code for access token
            token_resp = await client.post(
                "https://www.linkedin.com/oauth/v2/accessToken",
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": redirect_uri,
                    "client_id": client_id,
                    "client_secret": client_secret,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            token_resp.raise_for_status()
            token_data = token_resp.json()
            access_token = token_data.get("access_token")
            expires_in = token_data.get("expires_in")

            if not access_token:
                return RedirectResponse(redirect_error)

            # Fetch profile using OpenID Connect userinfo endpoint
            me_resp = await client.get(
                "https://api.linkedin.com/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            me_resp.raise_for_status()
            me = me_resp.json()
            person_id = me.get("sub")  # OpenID Connect uses 'sub' for user ID
            display_name = me.get("name", "")
            email = me.get("email", "")
            person_urn = f"urn:li:person:{person_id}" if person_id else None

        # Upsert SocialAccount
        result = await db.execute(
            select(SocialAccount).where(
                SocialAccount.user_id == user_id,
                SocialAccount.platform == PlatformType.LINKEDIN,
            )
        )
        account = result.scalar_one_or_none()

        expires_at = None
        if expires_in:
            expires_at = datetime.utcnow() + timedelta(seconds=int(expires_in))

        if account:
            account.access_token = access_token
            account.username = email
            account.display_name = display_name or account.display_name
            account.platform_user_id = person_id or account.platform_user_id
            account.platform_data = {
                **(account.platform_data or {}),
                "person_urn": person_urn,
                "email": email,
            }
            account.is_active = True
            account.is_connected = True
            account.token_expires_at = expires_at
        else:
            account = SocialAccount(
                user_id=user_id,
                platform=PlatformType.LINKEDIN,
                platform_user_id=person_id,
                username=email,
                display_name=display_name,
                access_token=access_token,
                refresh_token=None,
                platform_data={"person_urn": person_urn, "email": email},
                is_active=True,
                is_connected=True,
                token_expires_at=expires_at,
            )
            db.add(account)

        await db.commit()
        return RedirectResponse(redirect_success)
    except Exception:
        return RedirectResponse(redirect_error)


# Placeholder endpoints for other platforms (optional future work)
@router.get("/{platform}/authorize")
async def generic_authorize(platform: str):
    raise HTTPException(status_code=501, detail=f"OAuth not implemented for {platform}")


@router.get("/{platform}/callback")
async def generic_callback(platform: str):
    raise HTTPException(status_code=501, detail=f"OAuth not implemented for {platform}")

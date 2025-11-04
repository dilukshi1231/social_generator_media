from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx
import secrets
import urllib.parse
import base64
from datetime import datetime, timedelta

from app.core.config import settings
from app.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.social_account import SocialAccount, PlatformType
from .common import _oauth_state_store

router = APIRouter()


def _twitter_redirect_uri() -> str:
    # Prefer explicit setting, else infer from BACKEND_URL
    base = (
        getattr(settings, "TWITTER_REDIRECT_URI", "")
        or f"{getattr(settings, 'BACKEND_URL', 'http://localhost:8000')}/api/v1/oauth/twitter/callback"
    )
    return base


@router.get("/twitter/authorize")
async def twitter_authorize(current_user: User = Depends(get_current_user)):
    """Return a Twitter OAuth 2.0 authorization URL."""
    client_id = settings.TWITTER_CLIENT_ID
    if not client_id:
        raise HTTPException(
            status_code=500, detail="Twitter OAuth not configured (client id missing)"
        )

    state = secrets.token_urlsafe(16)
    _oauth_state_store[state] = current_user.id

    # Twitter OAuth 2.0 with PKCE (currently using plain; consider S256 in production)
    code_verifier = secrets.token_urlsafe(32)
    # Store code_verifier temporarily (in production, use Redis)
    _oauth_state_store[f"{state}_verifier"] = code_verifier

    # Twitter requires specific scopes for posting
    params = {
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": _twitter_redirect_uri(),
        "scope": "tweet.read tweet.write users.read offline.access",
        "state": state,
        "code_challenge": code_verifier,  # For simplicity, using plain (in production use S256)
        "code_challenge_method": "plain",
    }
    url = "https://twitter.com/i/oauth2/authorize?" + urllib.parse.urlencode(params)
    return JSONResponse({"authorize_url": url})


@router.get("/twitter/callback")
async def twitter_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Handle Twitter OAuth callback."""
    frontend_redirect_base = settings.FRONTEND_URL or "http://localhost:3000"
    redirect_success = f"{frontend_redirect_base}/dashboard/social-accounts?connected=twitter&status=success"
    redirect_error = f"{frontend_redirect_base}/dashboard/social-accounts?connected=twitter&status=error"

    if error:
        print(f"[Twitter OAuth] Error from Twitter: {error}")
        return RedirectResponse(redirect_error)

    if not code or not state or state not in _oauth_state_store:
        print(f"[Twitter OAuth] Missing code or state")
        return RedirectResponse(redirect_error)

    user_id = _oauth_state_store.pop(state)
    code_verifier = _oauth_state_store.pop(f"{state}_verifier", "")

    client_id = settings.TWITTER_CLIENT_ID
    client_secret = settings.TWITTER_CLIENT_SECRET
    redirect_uri = _twitter_redirect_uri()

    if not client_id or not client_secret:
        print(f"[Twitter OAuth] Missing app credentials")
        return RedirectResponse(redirect_error)

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print(f"[Twitter OAuth] Starting OAuth flow for user {user_id}")

            # Step 1: Exchange code for access token
            token_url = "https://api.twitter.com/2/oauth2/token"

            credentials = base64.b64encode(
                f"{client_id}:{client_secret}".encode()
            ).decode()

            token_data = {
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
                "code_verifier": code_verifier,
            }

            headers = {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": f"Basic {credentials}",
            }

            token_resp = await client.post(token_url, data=token_data, headers=headers)
            token_resp.raise_for_status()
            token_response = token_resp.json()

            access_token = token_response.get("access_token")
            refresh_token = token_response.get("refresh_token")
            expires_in = token_response.get("expires_in")

            print(f"[Twitter OAuth] Got access token")

            if not access_token:
                print("[Twitter OAuth] Failed to get access token")
                return RedirectResponse(
                    f"{redirect_error}&error_detail=No_access_token"
                )

            # Step 2: Get user's Twitter profile
            me_url = "https://api.twitter.com/2/users/me"
            me_params = {"user.fields": "id,name,username,profile_image_url"}
            me_headers = {"Authorization": f"Bearer {access_token}"}

            me_resp = await client.get(me_url, params=me_params, headers=me_headers)
            me_resp.raise_for_status()
            me_data = me_resp.json()

            user_data = me_data.get("data", {})
            twitter_user_id = user_data.get("id")
            username = user_data.get("username")
            display_name = user_data.get("name", username)
            profile_image = user_data.get("profile_image_url")

            print(f"[Twitter OAuth] Connected to @{username}")

        # Upsert SocialAccount
        result = await db.execute(
            select(SocialAccount).where(
                SocialAccount.user_id == user_id,
                SocialAccount.platform == PlatformType.TWITTER,
            )
        )
        account = result.scalar_one_or_none()

        expires_at = None
        if expires_in:
            expires_at = datetime.utcnow() + timedelta(seconds=int(expires_in))

        if account:
            account.access_token = access_token
            account.refresh_token = refresh_token
            account.username = username
            account.display_name = display_name or account.display_name
            account.platform_user_id = twitter_user_id or account.platform_user_id
            account.platform_data = {
                **(account.platform_data or {}),
                "profile_image_url": profile_image,
            }
            account.is_active = True
            account.is_connected = True
            account.token_expires_at = expires_at
        else:
            account = SocialAccount(
                user_id=user_id,
                platform=PlatformType.TWITTER,
                platform_user_id=twitter_user_id,
                username=username,
                display_name=display_name,
                access_token=access_token,
                refresh_token=refresh_token,
                platform_data={"profile_image_url": profile_image},
                is_active=True,
                is_connected=True,
                token_expires_at=expires_at,
            )
            db.add(account)

        await db.commit()
        print(f"[Twitter OAuth] Successfully connected @{username}")
        return RedirectResponse(redirect_success)
    except Exception as e:
        import traceback

        print(f"[Twitter OAuth] Error: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        error_msg = str(e).replace(" ", "_")[:100]
        return RedirectResponse(f"{redirect_error}&error_detail={error_msg}")

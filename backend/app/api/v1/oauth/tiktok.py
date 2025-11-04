from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import httpx
import secrets
import urllib.parse
import hashlib
import base64
from datetime import datetime, timedelta

from app.core.config import settings
from app.database import get_db
from app.api.v1.auth import get_current_user
from app.models.user import User
from app.models.social_account import SocialAccount, PlatformType
from .common import _oauth_state_store, _pkce_store, _PKCE_TTL_SECONDS

router = APIRouter()


def _tiktok_redirect_uri() -> str:
    """Get TikTok redirect URI from settings or construct from BACKEND_URL."""
    return (
        settings.TIKTOK_REDIRECT_URI
        or f"{getattr(settings, 'BACKEND_URL', 'http://localhost:8000')}/api/v1/oauth/tiktok/callback"
    )


@router.get("/tiktok/authorize")
async def tiktok_authorize(current_user: User = Depends(get_current_user)):
    """Initiate TikTok OAuth 2.0 authorization with PKCE."""
    client_key = settings.TIKTOK_CLIENT_KEY
    redirect_uri = _tiktok_redirect_uri()

    if not client_key:
        raise HTTPException(
            status_code=500, detail="TikTok OAuth not configured on server"
        )

    # Generate state for CSRF protection
    state = secrets.token_urlsafe(32)
    _oauth_state_store[state] = current_user.id

    # Generate PKCE code_verifier and code_challenge (S256)
    # Use a random 64-byte value and base64-url encode to meet length requirements
    raw_verifier = secrets.token_bytes(64)
    code_verifier = base64.urlsafe_b64encode(raw_verifier).decode().rstrip("=")
    digest = hashlib.sha256(code_verifier.encode()).digest()
    code_challenge = base64.urlsafe_b64encode(digest).decode().rstrip("=")

    # Store code_verifier with timestamp to use in callback (simple TTL)
    _pkce_store[state] = (code_verifier, datetime.utcnow().timestamp())

    # TikTok OAuth 2.0 scopes
    # https://developers.tiktok.com/doc/login-kit-web/
    scope = "user.info.basic,video.publish"

    params = {
        "client_key": client_key,
        "scope": scope,
        "response_type": "code",
        "redirect_uri": redirect_uri,
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
    }

    url = "https://www.tiktok.com/v2/auth/authorize/?" + urllib.parse.urlencode(params)

    # Debug: print authorize URL (safe to remove in production)
    print(f"[TikTok OAuth] Authorize URL for user {current_user.id}: {url}")

    return JSONResponse({"authorize_url": url, "code_challenge": code_challenge})


@router.get("/tiktok/callback")
async def tiktok_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    error_description: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Handle TikTok OAuth callback."""
    frontend_redirect_base = settings.FRONTEND_URL or "http://localhost:3000"
    redirect_success = f"{frontend_redirect_base}/dashboard/social-accounts?connected=tiktok&status=success"
    redirect_error = f"{frontend_redirect_base}/dashboard/social-accounts?connected=tiktok&status=error"

    if error:
        print(f"[TikTok OAuth] Error from TikTok: {error} - {error_description}")
        return RedirectResponse(redirect_error)

    if not code or not state or state not in _oauth_state_store:
        print(f"[TikTok OAuth] Missing code or state")
        return RedirectResponse(redirect_error)

    user_id = _oauth_state_store.pop(state)
    pkce_entry = _pkce_store.pop(state, None)  # Get code_verifier for PKCE

    if not pkce_entry:
        print(f"[TikTok OAuth] Missing code_verifier for PKCE")
        return RedirectResponse(redirect_error)

    code_verifier, ts = pkce_entry
    # Simple TTL check
    if datetime.utcnow().timestamp() - ts > _PKCE_TTL_SECONDS:
        print(f"[TikTok OAuth] PKCE code_verifier expired for state {state}")
        return RedirectResponse(redirect_error)

    client_key = settings.TIKTOK_CLIENT_KEY
    client_secret = settings.TIKTOK_CLIENT_SECRET
    redirect_uri = _tiktok_redirect_uri()

    if not client_key or not client_secret:
        print(f"[TikTok OAuth] Missing app credentials")
        return RedirectResponse(redirect_error)

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print(f"[TikTok OAuth] Starting OAuth flow for user {user_id}")

            # Step 1: Exchange code for access token (with PKCE code_verifier)
            token_url = "https://open.tiktokapis.com/v2/oauth/token/"

            token_data = {
                "client_key": client_key,
                "client_secret": client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": redirect_uri,
                "code_verifier": code_verifier,  # PKCE verification
            }

            headers = {
                "Content-Type": "application/x-www-form-urlencoded",
            }

            token_resp = await client.post(token_url, data=token_data, headers=headers)
            token_resp.raise_for_status()
            token_response = token_resp.json()

            # TikTok returns data in a nested structure
            data = token_response.get("data", {})
            access_token = data.get("access_token")
            refresh_token = data.get("refresh_token")
            expires_in = data.get("expires_in")
            open_id = data.get("open_id")  # TikTok user ID

            print(f"[TikTok OAuth] Got access token")

            if not access_token:
                print("[TikTok OAuth] Failed to get access token")
                return RedirectResponse(
                    f"{redirect_error}&error_detail=No_access_token"
                )

            # Step 2: Get user's TikTok profile
            user_url = "https://open.tiktokapis.com/v2/user/info/"
            user_params = {"fields": "open_id,union_id,avatar_url,display_name"}
            user_headers = {"Authorization": f"Bearer {access_token}"}

            user_resp = await client.get(
                user_url, params=user_params, headers=user_headers
            )
            user_resp.raise_for_status()
            user_data_response = user_resp.json()

            user_data = user_data_response.get("data", {}).get("user", {})
            display_name = user_data.get("display_name", "TikTok User")
            avatar_url = user_data.get("avatar_url")
            union_id = user_data.get("union_id")

            print(f"[TikTok OAuth] Connected to {display_name}")

        # Upsert SocialAccount
        result = await db.execute(
            select(SocialAccount).where(
                SocialAccount.user_id == user_id,
                SocialAccount.platform == PlatformType.TIKTOK,
            )
        )
        account = result.scalar_one_or_none()

        expires_at = None
        if expires_in:
            expires_at = datetime.utcnow() + timedelta(seconds=int(expires_in))

        if account:
            account.access_token = access_token
            account.refresh_token = refresh_token
            account.username = open_id  # Use open_id as username
            account.display_name = display_name or account.display_name
            account.platform_user_id = union_id or open_id or account.platform_user_id
            account.platform_data = {
                **(account.platform_data or {}),
                "open_id": open_id,
                "union_id": union_id,
                "avatar_url": avatar_url,
            }
            account.is_active = True
            account.is_connected = True
            account.token_expires_at = expires_at
        else:
            account = SocialAccount(
                user_id=user_id,
                platform=PlatformType.TIKTOK,
                platform_user_id=union_id or open_id,
                username=open_id,
                display_name=display_name,
                access_token=access_token,
                refresh_token=refresh_token,
                platform_data={
                    "open_id": open_id,
                    "union_id": union_id,
                    "avatar_url": avatar_url,
                },
                is_active=True,
                is_connected=True,
                token_expires_at=expires_at,
            )
            db.add(account)

        await db.commit()
        print(f"[TikTok OAuth] Successfully connected {display_name}")
        return RedirectResponse(redirect_success)
    except Exception as e:
        import traceback

        print(f"[TikTok OAuth] Error: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        error_msg = str(e).replace(" ", "_")[:100]
        return RedirectResponse(f"{redirect_error}&error_detail={error_msg}")

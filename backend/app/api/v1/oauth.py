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


def _instagram_redirect_uri() -> str:
    # Prefer explicit setting, else infer from BACKEND_URL
    base = (
        getattr(settings, "INSTAGRAM_REDIRECT_URI", "")
        or f"{getattr(settings, 'BACKEND_URL', 'http://localhost:8000')}/api/v1/oauth/instagram/callback"
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


@router.get("/instagram/authorize")
async def instagram_authorize(current_user: User = Depends(get_current_user)):
    """Return an Instagram OAuth authorization URL (uses Facebook Login)."""
    app_id = settings.INSTAGRAM_APP_ID or settings.FACEBOOK_APP_ID
    if not app_id:
        raise HTTPException(
            status_code=500, detail="Instagram OAuth not configured (app id missing)"
        )

    state = secrets.token_urlsafe(16)
    _oauth_state_store[state] = current_user.id

    # Instagram uses Facebook OAuth with instagram scopes
    params = {
        "client_id": app_id,
        "redirect_uri": _instagram_redirect_uri(),
        "scope": "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement",
        "response_type": "code",
        "state": state,
    }
    url = "https://www.facebook.com/v18.0/dialog/oauth?" + urllib.parse.urlencode(
        params
    )
    return JSONResponse({"authorize_url": url})


@router.get("/instagram/callback")
async def instagram_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Handle Instagram OAuth callback (via Facebook)."""
    frontend_redirect_base = settings.FRONTEND_URL or "http://localhost:3000"
    redirect_success = f"{frontend_redirect_base}/dashboard/social-accounts?connected=instagram&status=success"
    redirect_error = f"{frontend_redirect_base}/dashboard/social-accounts?connected=instagram&status=error"

    if error:
        return RedirectResponse(redirect_error)

    if not code or not state or state not in _oauth_state_store:
        return RedirectResponse(redirect_error)

    user_id = _oauth_state_store.pop(state)

    app_id = settings.INSTAGRAM_APP_ID or settings.FACEBOOK_APP_ID
    app_secret = settings.INSTAGRAM_APP_SECRET or settings.FACEBOOK_APP_SECRET
    redirect_uri = _instagram_redirect_uri()

    if not app_id or not app_secret:
        return RedirectResponse(redirect_error)

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print(f"[Instagram OAuth] Starting OAuth flow for user {user_id}")
            print(f"[Instagram OAuth] App ID: {app_id}")
            print(f"[Instagram OAuth] Redirect URI: {redirect_uri}")

            # Step 1: Exchange code for short-lived access token
            token_url = "https://graph.facebook.com/v18.0/oauth/access_token"
            token_params = {
                "client_id": app_id,
                "client_secret": app_secret,
                "redirect_uri": redirect_uri,
                "code": code,
            }
            token_resp = await client.get(token_url, params=token_params)
            token_resp.raise_for_status()
            token_data = token_resp.json()
            short_lived_token = token_data.get("access_token")

            print(
                f"[Instagram OAuth] Got short-lived token: {short_lived_token[:20]}..."
                if short_lived_token
                else "[Instagram OAuth] No token received"
            )

            if not short_lived_token:
                print("[Instagram OAuth] Failed to get short-lived token")
                return RedirectResponse(
                    f"{redirect_error}&error_detail=No_access_token"
                )

            # Step 2: Exchange for long-lived token
            long_lived_url = "https://graph.facebook.com/v18.0/oauth/access_token"
            long_lived_params = {
                "grant_type": "fb_exchange_token",
                "client_id": app_id,
                "client_secret": app_secret,
                "fb_exchange_token": short_lived_token,
            }
            long_lived_resp = await client.get(long_lived_url, params=long_lived_params)
            long_lived_resp.raise_for_status()
            long_lived_data = long_lived_resp.json()
            access_token = long_lived_data.get("access_token")
            expires_in = long_lived_data.get("expires_in")

            # Step 3: Get user's Facebook pages
            pages_url = "https://graph.facebook.com/v18.0/me/accounts"
            pages_params = {"access_token": access_token}
            pages_resp = await client.get(pages_url, params=pages_params)
            pages_resp.raise_for_status()
            pages_data = pages_resp.json()
            pages = pages_data.get("data", [])

            print(f"[Instagram OAuth] Found {len(pages)} Facebook pages")

            if not pages:
                print(
                    "[Instagram OAuth] No Facebook pages found - user needs a Facebook Page"
                )
                return RedirectResponse(
                    f"{redirect_error}&error_detail=No_Facebook_Page_found"
                )

            # Step 4: Get Instagram Business Account connected to the first page
            page = pages[0]  # Use first page for now
            page_id = page.get("id")
            page_token = page.get("access_token")

            print(f"[Instagram OAuth] Using page: {page.get('name')} (ID: {page_id})")

            ig_account_url = f"https://graph.facebook.com/v18.0/{page_id}"
            ig_account_params = {
                "fields": "instagram_business_account",
                "access_token": page_token,
            }
            ig_account_resp = await client.get(ig_account_url, params=ig_account_params)
            ig_account_resp.raise_for_status()
            ig_account_data = ig_account_resp.json()

            print(f"[Instagram OAuth] Page data: {ig_account_data}")

            instagram_business_account = ig_account_data.get(
                "instagram_business_account", {}
            )
            ig_user_id = instagram_business_account.get("id")

            if not ig_user_id:
                print(
                    "[Instagram OAuth] No Instagram Business Account linked to this Facebook Page"
                )
                return RedirectResponse(
                    f"{redirect_error}&error_detail=No_Instagram_Business_Account_linked"
                )

            # Step 5: Get Instagram account info
            ig_user_url = f"https://graph.facebook.com/v18.0/{ig_user_id}"
            ig_user_params = {
                "fields": "id,username,name,profile_picture_url",
                "access_token": page_token,
            }
            ig_user_resp = await client.get(ig_user_url, params=ig_user_params)
            ig_user_resp.raise_for_status()
            ig_user_info = ig_user_resp.json()

            username = ig_user_info.get("username", "")
            display_name = ig_user_info.get("name", username)

        # Upsert SocialAccount
        result = await db.execute(
            select(SocialAccount).where(
                SocialAccount.user_id == user_id,
                SocialAccount.platform == PlatformType.INSTAGRAM,
            )
        )
        account = result.scalar_one_or_none()

        expires_at = None
        if expires_in:
            expires_at = datetime.utcnow() + timedelta(seconds=int(expires_in))

        if account:
            account.access_token = page_token
            account.username = username
            account.display_name = display_name or account.display_name
            account.platform_user_id = ig_user_id or account.platform_user_id
            account.platform_data = {
                **(account.platform_data or {}),
                "instagram_business_account_id": ig_user_id,
                "facebook_page_id": page_id,
                "facebook_page_token": page_token,
            }
            account.is_active = True
            account.is_connected = True
            account.token_expires_at = expires_at
        else:
            account = SocialAccount(
                user_id=user_id,
                platform=PlatformType.INSTAGRAM,
                platform_user_id=ig_user_id,
                username=username,
                display_name=display_name,
                access_token=page_token,
                refresh_token=None,
                platform_data={
                    "instagram_business_account_id": ig_user_id,
                    "facebook_page_id": page_id,
                    "facebook_page_token": page_token,
                },
                is_active=True,
                is_connected=True,
                token_expires_at=expires_at,
            )
            db.add(account)

        await db.commit()
        return RedirectResponse(redirect_success)
    except Exception as e:
        import traceback

        print(f"Instagram OAuth error: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        # Add error details to redirect for debugging
        error_msg = str(e).replace(" ", "_")[:100]
        return RedirectResponse(f"{redirect_error}&error_detail={error_msg}")


def _facebook_redirect_uri() -> str:
    # Prefer explicit setting, else infer from BACKEND_URL
    base = (
        getattr(settings, "FACEBOOK_REDIRECT_URI", "")
        or f"{getattr(settings, 'BACKEND_URL', 'http://localhost:8000')}/api/v1/oauth/facebook/callback"
    )
    return base


@router.get("/facebook/authorize")
async def facebook_authorize(current_user: User = Depends(get_current_user)):
    """Return a Facebook OAuth authorization URL."""
    app_id = settings.FACEBOOK_APP_ID
    if not app_id:
        raise HTTPException(
            status_code=500, detail="Facebook OAuth not configured (app id missing)"
        )

    state = secrets.token_urlsafe(16)
    _oauth_state_store[state] = current_user.id

    # Facebook OAuth with pages permissions
    params = {
        "client_id": app_id,
        "redirect_uri": _facebook_redirect_uri(),
        "scope": "pages_show_list,pages_read_engagement,pages_manage_posts,pages_read_user_content,public_profile",
        "response_type": "code",
        "state": state,
    }
    url = "https://www.facebook.com/v18.0/dialog/oauth?" + urllib.parse.urlencode(
        params
    )
    return JSONResponse({"authorize_url": url})


@router.get("/facebook/callback")
async def facebook_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Handle Facebook OAuth callback."""
    frontend_redirect_base = settings.FRONTEND_URL or "http://localhost:3000"
    redirect_success = f"{frontend_redirect_base}/dashboard/social-accounts?connected=facebook&status=success"
    redirect_error = f"{frontend_redirect_base}/dashboard/social-accounts?connected=facebook&status=error"

    if error:
        print(f"[Facebook OAuth] Error from Facebook: {error}")
        return RedirectResponse(redirect_error)

    if not code or not state or state not in _oauth_state_store:
        print(f"[Facebook OAuth] Missing code or state")
        return RedirectResponse(redirect_error)

    user_id = _oauth_state_store.pop(state)

    app_id = settings.FACEBOOK_APP_ID
    app_secret = settings.FACEBOOK_APP_SECRET
    redirect_uri = _facebook_redirect_uri()

    if not app_id or not app_secret:
        print(f"[Facebook OAuth] Missing app credentials")
        return RedirectResponse(redirect_error)

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print(f"[Facebook OAuth] Starting OAuth flow for user {user_id}")
            print(f"[Facebook OAuth] App ID: {app_id}")
            print(f"[Facebook OAuth] Redirect URI: {redirect_uri}")

            # Step 1: Exchange code for access token
            token_url = "https://graph.facebook.com/v18.0/oauth/access_token"
            token_params = {
                "client_id": app_id,
                "client_secret": app_secret,
                "redirect_uri": redirect_uri,
                "code": code,
            }
            token_resp = await client.get(token_url, params=token_params)
            token_resp.raise_for_status()
            token_data = token_resp.json()
            short_lived_token = token_data.get("access_token")

            print(
                f"[Facebook OAuth] Got short-lived token: {short_lived_token[:20]}..."
                if short_lived_token
                else "[Facebook OAuth] No token received"
            )

            if not short_lived_token:
                print("[Facebook OAuth] Failed to get short-lived token")
                return RedirectResponse(
                    f"{redirect_error}&error_detail=No_access_token"
                )

            # Step 2: Exchange for long-lived token
            long_lived_url = "https://graph.facebook.com/v18.0/oauth/access_token"
            long_lived_params = {
                "grant_type": "fb_exchange_token",
                "client_id": app_id,
                "client_secret": app_secret,
                "fb_exchange_token": short_lived_token,
            }
            long_lived_resp = await client.get(long_lived_url, params=long_lived_params)
            long_lived_resp.raise_for_status()
            long_lived_data = long_lived_resp.json()
            access_token = long_lived_data.get("access_token")
            expires_in = long_lived_data.get("expires_in")

            print(f"[Facebook OAuth] Got long-lived token")

            # Step 3: Get user's Facebook pages
            pages_url = "https://graph.facebook.com/v18.0/me/accounts"
            pages_params = {"access_token": access_token}
            pages_resp = await client.get(pages_url, params=pages_params)
            pages_resp.raise_for_status()
            pages_data = pages_resp.json()
            pages = pages_data.get("data", [])

            print(f"[Facebook OAuth] Found {len(pages)} Facebook pages")

            if not pages:
                print("[Facebook OAuth] No Facebook pages found")
                return RedirectResponse(
                    f"{redirect_error}&error_detail=No_Facebook_Page_found"
                )

            # Step 4: Use the first page (or let user select later)
            page = pages[0]
            page_id = page.get("id")
            page_name = page.get("name")
            page_token = page.get("access_token")

            print(f"[Facebook OAuth] Using page: {page_name} (ID: {page_id})")

            # Step 5: Get page info
            page_info_url = f"https://graph.facebook.com/v18.0/{page_id}"
            page_info_params = {
                "fields": "id,name,category,picture",
                "access_token": page_token,
            }
            page_info_resp = await client.get(page_info_url, params=page_info_params)
            page_info_resp.raise_for_status()
            page_info = page_info_resp.json()

        # Upsert SocialAccount
        result = await db.execute(
            select(SocialAccount).where(
                SocialAccount.user_id == user_id,
                SocialAccount.platform == PlatformType.FACEBOOK,
            )
        )
        account = result.scalar_one_or_none()

        expires_at = None
        if expires_in:
            expires_at = datetime.utcnow() + timedelta(seconds=int(expires_in))

        if account:
            account.access_token = page_token
            account.username = page_name
            account.display_name = page_name
            account.platform_user_id = page_id
            account.platform_data = {
                **(account.platform_data or {}),
                "page_id": page_id,
                "page_name": page_name,
                "page_token": page_token,
                "category": page_info.get("category", ""),
            }
            account.is_active = True
            account.is_connected = True
            account.token_expires_at = expires_at
        else:
            account = SocialAccount(
                user_id=user_id,
                platform=PlatformType.FACEBOOK,
                platform_user_id=page_id,
                username=page_name,
                display_name=page_name,
                access_token=page_token,
                refresh_token=None,
                platform_data={
                    "page_id": page_id,
                    "page_name": page_name,
                    "page_token": page_token,
                    "category": page_info.get("category", ""),
                },
                is_active=True,
                is_connected=True,
                token_expires_at=expires_at,
            )
            db.add(account)

        await db.commit()
        print(f"[Facebook OAuth] Successfully connected page: {page_name}")
        return RedirectResponse(redirect_success)
    except Exception as e:
        import traceback

        print(f"[Facebook OAuth] Error: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        error_msg = str(e).replace(" ", "_")[:100]
        return RedirectResponse(f"{redirect_error}&error_detail={error_msg}")


# Placeholder endpoints for other platforms (optional future work)
@router.get("/{platform}/authorize")
async def generic_authorize(platform: str):
    raise HTTPException(status_code=501, detail=f"OAuth not implemented for {platform}")


@router.get("/{platform}/callback")
async def generic_callback(platform: str):
    raise HTTPException(status_code=501, detail=f"OAuth not implemented for {platform}")

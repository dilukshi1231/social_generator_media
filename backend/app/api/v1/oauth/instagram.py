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
from .common import _oauth_state_store

router = APIRouter()


def _instagram_redirect_uri() -> str:
    # Prefer explicit setting, else infer from BACKEND_URL
    base = (
        getattr(settings, "INSTAGRAM_REDIRECT_URI", "")
        or f"{getattr(settings, 'BACKEND_URL', 'http://localhost:8000')}/api/v1/oauth/instagram/callback"
    )
    return base


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
    error_reason: str | None = None,
    error_description: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Handle Instagram OAuth callback (via Facebook)."""
    frontend_redirect_base = settings.FRONTEND_URL or "http://localhost:3000"
    redirect_success = f"{frontend_redirect_base}/dashboard/social-accounts?connected=instagram&status=success"
    redirect_error = f"{frontend_redirect_base}/dashboard/social-accounts?connected=instagram&status=error"

    if error:
        error_detail = error_description or error_reason or error
        print(f"[Instagram OAuth] Error from Facebook: {error_detail}")
        return RedirectResponse(
            f"{redirect_error}&error_detail={error_detail.replace(' ', '_')}"
        )

    if not code:
        print("[Instagram OAuth] Missing authorization code")
        return RedirectResponse(
            f"{redirect_error}&error_detail=Missing_authorization_code"
        )

    if not state or state not in _oauth_state_store:
        print("[Instagram OAuth] Invalid or missing state parameter")
        return RedirectResponse(
            f"{redirect_error}&error_detail=Invalid_state_parameter"
        )

    user_id = _oauth_state_store.pop(state)

    app_id = settings.INSTAGRAM_APP_ID or settings.FACEBOOK_APP_ID
    app_secret = settings.INSTAGRAM_APP_SECRET or settings.FACEBOOK_APP_SECRET
    redirect_uri = _instagram_redirect_uri()

    if not app_id or not app_secret:
        print("[Instagram OAuth] Missing Instagram/Facebook credentials in settings")
        return RedirectResponse(
            f"{redirect_error}&error_detail=Missing_app_credentials"
        )

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
                print(f"[Instagram OAuth] Token response: {token_data}")
                return RedirectResponse(
                    f"{redirect_error}&error_detail=No_access_token_from_Facebook"
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
            access_token = long_lived_data.get(
                "access_token", short_lived_token
            )  # Fallback to short-lived if no long-lived
            expires_in = long_lived_data.get("expires_in")

            print(f"[Instagram OAuth] Got long-lived token, expires in: {expires_in}")

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
                print("[Instagram OAuth] SOLUTION: Create a Facebook Page:")
                print("[Instagram OAuth] 1. Go to facebook.com/pages/create")
                print("[Instagram OAuth] 2. Create a new page for your business/brand")
                print(
                    "[Instagram OAuth] 3. Link your Instagram Business account to the page"
                )
                print("[Instagram OAuth] 4. Try connecting again")
                return RedirectResponse(
                    f"{redirect_error}&error_detail=No_Facebook_Page_Create_at_facebook.com/pages/create"
                )

            # Step 4: Get Instagram Business Account connected to the first page
            # Try to find a page with an Instagram account, otherwise use the first page
            page_with_instagram = None
            for p in pages:
                page_id_temp = p.get("id")
                page_token_temp = p.get("access_token")

                # Check if this page has an Instagram account
                ig_check_resp = await client.get(
                    f"https://graph.facebook.com/v18.0/{page_id_temp}",
                    params={
                        "fields": "instagram_business_account",
                        "access_token": page_token_temp,
                    },
                )
                if ig_check_resp.status_code == 200:
                    ig_check_data = ig_check_resp.json()
                    if ig_check_data.get("instagram_business_account"):
                        page_with_instagram = p
                        print(
                            f"[Instagram OAuth] Found page with Instagram: {p.get('name')}"
                        )
                        break

            # Use the page with Instagram, or fall back to first page
            page = page_with_instagram or pages[0]
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
                page_name = page.get("name", "your page")
                print(
                    f"[Instagram OAuth] No Instagram Business Account linked to Facebook Page: {page_name}"
                )
                print(
                    f"[Instagram OAuth] SOLUTION: Link your Instagram Business account to '{page_name}':"
                )
                print(
                    f"[Instagram OAuth] NOTE: Connecting Instagram in Account Center is NOT enough!"
                )
                print(
                    f"[Instagram OAuth] You must link Instagram to the FACEBOOK PAGE (not just your account):"
                )
                print(
                    f"[Instagram OAuth] 1. Go to facebook.com/pages → Select '{page_name}'"
                )
                print(f"[Instagram OAuth] 2. Click Settings (left sidebar) → Instagram")
                print(
                    f"[Instagram OAuth] 3. Click 'Connect Account' and enter Instagram credentials"
                )
                print(
                    f"[Instagram OAuth] 4. See INSTAGRAM_PAGE_VS_ACCOUNT.md for the difference"
                )

                # More detailed error message for frontend
                error_msg = f"Link_Instagram_to_PAGE_{page_name.replace(' ', '_')}_not_just_Account_Center"
                return RedirectResponse(f"{redirect_error}&error_detail={error_msg}")

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
        print(f"[Instagram OAuth] Successfully connected Instagram account: {username}")
        return RedirectResponse(redirect_success)
    except httpx.HTTPStatusError as e:
        import traceback

        print(f"[Instagram OAuth] HTTP error: {e}")
        print(
            f"[Instagram OAuth] Response: {e.response.text if hasattr(e, 'response') else 'N/A'}"
        )
        print(f"[Instagram OAuth] Traceback: {traceback.format_exc()}")
        error_msg = f"HTTP_{e.response.status_code}_{str(e)[:50]}".replace(" ", "_")
        return RedirectResponse(f"{redirect_error}&error_detail={error_msg}")
    except Exception as e:
        import traceback

        print(f"[Instagram OAuth] Unexpected error: {e}")
        print(f"[Instagram OAuth] Traceback: {traceback.format_exc()}")
        error_msg = str(e).replace(" ", "_")[:80]
        return RedirectResponse(f"{redirect_error}&error_detail={error_msg}")

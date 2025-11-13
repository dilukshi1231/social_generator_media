from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from pydantic import BaseModel
import httpx

from app.database import get_db
from app.models.user import User
from app.models.social_account import SocialAccount, PlatformType
from app.api.v1.auth import get_current_user
from app.schemas.social_account import (
    TokenConnectionRequest,
    TokenConnectionResponse,
    TokenTestRequest,
    TokenTestResponse,
)


router = APIRouter()


# Schemas
class SocialAccountCreate(BaseModel):
    platform: PlatformType
    username: Optional[str] = None
    access_token: str
    refresh_token: Optional[str] = None
    platform_user_id: Optional[str] = None
    display_name: Optional[str] = None
    platform_data: Optional[Dict] = None


class SocialAccountUpdate(BaseModel):
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    is_active: Optional[bool] = None
    platform_data: Optional[Dict] = None


class SocialAccountResponse(BaseModel):
    id: int
    platform: PlatformType
    username: Optional[str]
    display_name: Optional[str]
    platform_user_id: Optional[str]
    is_active: bool
    is_connected: bool
    connected_at: datetime
    last_posted_at: Optional[datetime]

    class Config:
        from_attributes = True


@router.post("/", response_model=SocialAccountResponse, status_code=status.HTTP_201_CREATED)
async def connect_social_account(
    account_data: SocialAccountCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Connect a new social media account."""

    # Check if account already exists
    result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.user_id == current_user.id,
            SocialAccount.platform == account_data.platform,
        )
    )
    existing_account = result.scalar_one_or_none()

    if existing_account:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{account_data.platform} account already connected",
        )

    # Create new social account
    new_account = SocialAccount(
        user_id=current_user.id,
        platform=account_data.platform,
        username=account_data.username,
        display_name=account_data.display_name,
        platform_user_id=account_data.platform_user_id,
        access_token=account_data.access_token,
        refresh_token=account_data.refresh_token,
        platform_data=account_data.platform_data or {},
        is_active=True,
        is_connected=True,
    )

    db.add(new_account)
    await db.commit()
    await db.refresh(new_account)

    return new_account


@router.get("/", response_model=List[SocialAccountResponse])
async def list_social_accounts(
    platform: Optional[PlatformType] = None,
    active_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all connected social media accounts."""
    query = select(SocialAccount).where(SocialAccount.user_id == current_user.id)

    if platform:
        query = query.where(SocialAccount.platform == platform)

    if active_only:
        query = query.where(SocialAccount.is_active == True)

    query = query.order_by(SocialAccount.connected_at.desc())

    result = await db.execute(query)
    accounts = result.scalars().all()

    return accounts


@router.get("/{account_id}", response_model=SocialAccountResponse)
async def get_social_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get specific social media account."""
    result = await db.execute(
        select(SocialAccount).where(SocialAccount.id == account_id, SocialAccount.user_id == current_user.id)
    )
    account = result.scalar_one_or_none()

    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Social account not found")

    return account


@router.put("/{account_id}", response_model=SocialAccountResponse)
async def update_social_account(
    account_id: int,
    update_data: SocialAccountUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update social media account details."""
    result = await db.execute(
        select(SocialAccount).where(SocialAccount.id == account_id, SocialAccount.user_id == current_user.id)
    )
    account = result.scalar_one_or_none()

    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Social account not found")

    # Update fields
    if update_data.access_token is not None:
        account.access_token = update_data.access_token

    if update_data.refresh_token is not None:
        account.refresh_token = update_data.refresh_token

    if update_data.is_active is not None:
        account.is_active = update_data.is_active

    if update_data.platform_data is not None:
        account.platform_data = update_data.platform_data

    await db.commit()
    await db.refresh(account)

    return account


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def disconnect_social_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Disconnect/delete a social media account."""
    result = await db.execute(
        select(SocialAccount).where(SocialAccount.id == account_id, SocialAccount.user_id == current_user.id)
    )
    account = result.scalar_one_or_none()

    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Social account not found")

    await db.delete(account)
    await db.commit()

    return None


@router.post("/{account_id}/refresh-token", response_model=SocialAccountResponse)
async def refresh_account_token(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Refresh access token for a social media account."""
    result = await db.execute(
        select(SocialAccount).where(SocialAccount.id == account_id, SocialAccount.user_id == current_user.id)
    )
    account = result.scalar_one_or_none()

    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Social account not found")

    # TODO: Implement platform-specific token refresh logic
    # This would call the respective OAuth provider's token refresh endpoint

    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Token refresh not yet implemented for this platform",
    )


@router.get("/platforms/available")
async def get_available_platforms():
    """Get list of available social media platforms."""
    return {
        "platforms": [
            {
                "name": "Facebook",
                "value": "facebook",
                "icon": "facebook",
                "color": "#1877F2",
            },
            {
                "name": "Instagram",
                "value": "instagram",
                "icon": "instagram",
                "color": "#E4405F",
            },
            {
                "name": "LinkedIn",
                "value": "linkedin",
                "icon": "linkedin",
                "color": "#0A66C2",
            },
            {
                "name": "Twitter / X",
                "value": "twitter",
                "icon": "twitter",
                "color": "#000000",
            },
            {"name": "TikTok", "value": "tiktok", "icon": "tiktok", "color": "#000000"},
        ]
    }


@router.post("/{account_id}/verify", response_model=dict)
async def verify_account_connection(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Verify if the social media account connection is still valid."""
    import httpx

    result = await db.execute(
        select(SocialAccount).where(SocialAccount.id == account_id, SocialAccount.user_id == current_user.id)
    )
    account = result.scalar_one_or_none()

    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Social account not found")

    # Verify based on platform
    try:
        if account.platform == PlatformType.LINKEDIN:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Test the token by fetching user info
                response = await client.get(
                    "https://api.linkedin.com/v2/userinfo",
                    headers={"Authorization": f"Bearer {account.access_token}"},
                )
                response.raise_for_status()
                user_info = response.json()

                return {
                    "valid": True,
                    "platform": account.platform,
                    "user_id": user_info.get("sub"),
                    "name": user_info.get("name"),
                    "message": "Connection is active and valid",
                }

        elif account.platform == PlatformType.TWITTER:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Test the token by fetching user info
                response = await client.get(
                    "https://api.twitter.com/2/users/me",
                    headers={"Authorization": f"Bearer {account.access_token}"},
                )
                response.raise_for_status()
                user_data = response.json()

                return {
                    "valid": True,
                    "platform": account.platform,
                    "user_id": user_data.get("data", {}).get("id"),
                    "username": user_data.get("data", {}).get("username"),
                    "message": "Connection is active and valid",
                }

        elif account.platform == PlatformType.TIKTOK:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Test the token by fetching user info
                response = await client.get(
                    "https://open.tiktokapis.com/v2/user/info/",
                    params={"fields": "open_id,display_name"},
                    headers={"Authorization": f"Bearer {account.access_token}"},
                )
                response.raise_for_status()
                user_data = response.json()

                return {
                    "valid": True,
                    "platform": account.platform,
                    "user_id": user_data.get("data", {}).get("user", {}).get("open_id"),
                    "display_name": user_data.get("data", {}).get("user", {}).get("display_name"),
                    "message": "Connection is active and valid",
                }

        elif account.platform == PlatformType.INSTAGRAM:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Get the Instagram Business Account ID and page token from platform_data
                ig_account_id = account.platform_data.get("instagram_business_account_id")
                page_token = account.platform_data.get("facebook_page_token") or account.access_token

                if not ig_account_id:
                    return {
                        "valid": False,
                        "platform": account.platform,
                        "message": "Missing Instagram Business Account ID",
                    }

                # Test the token by fetching Instagram account info
                response = await client.get(
                    f"https://graph.facebook.com/v18.0/{ig_account_id}",
                    params={
                        "fields": "id,username,name",
                        "access_token": page_token,
                    },
                )
                response.raise_for_status()
                user_data = response.json()

                return {
                    "valid": True,
                    "platform": account.platform,
                    "user_id": user_data.get("id"),
                    "username": user_data.get("username"),
                    "display_name": user_data.get("name"),
                    "message": "Connection is active and valid",
                }

        elif account.platform == PlatformType.FACEBOOK:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # Get the Facebook Page ID and page token from platform_data
                page_id = account.platform_data.get("page_id") or account.platform_user_id
                page_token = account.platform_data.get("page_token") or account.access_token

                if not page_id:
                    return {
                        "valid": False,
                        "platform": account.platform,
                        "message": "Missing Facebook Page ID",
                    }

                # Test the token by fetching page info
                response = await client.get(
                    f"https://graph.facebook.com/v18.0/{page_id}",
                    params={
                        "fields": "id,name,category",
                        "access_token": page_token,
                    },
                )
                response.raise_for_status()
                page_data = response.json()

                return {
                    "valid": True,
                    "platform": account.platform,
                    "page_id": page_data.get("id"),
                    "page_name": page_data.get("name"),
                    "message": "Connection is active and valid",
                }

        # Add verification for other platforms as needed
        else:
            return {
                "valid": True,
                "platform": account.platform,
                "message": "Verification not implemented for this platform",
            }

    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            # Token is invalid or expired
            account.is_active = False
            await db.commit()
            return {
                "valid": False,
                "platform": account.platform,
                "message": "Token expired or invalid. Please reconnect your account.",
            }
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to verify connection: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error verifying connection: {str(e)}",
        )


@router.post("/facebook/pages")
async def get_facebook_pages(
    data: Dict,
    current_user: User = Depends(get_current_user),
):
    """
    Fetch all Facebook Pages the user manages with their user access token.

    Returns list of pages with their IDs, names, and page access tokens.
    """
    try:
        user_access_token = data.get("access_token")
        if not user_access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Access token is required",
            )

        async with httpx.AsyncClient(timeout=10.0) as client:
            # Fetch user's pages with page access tokens and Instagram accounts
            response = await client.get(
                "https://graph.facebook.com/v18.0/me/accounts",
                params={
                    "fields": "id,name,access_token,category,instagram_business_account{id,username,name}",
                    "access_token": user_access_token,
                },
            )
            response.raise_for_status()
            data = response.json()

            pages = data.get("data", [])

            if not pages:
                return {
                    "success": False,
                    "message": "No Facebook Pages found. Make sure you have admin access to at least one page.",
                    "pages": [],
                }

            # Format pages for frontend
            formatted_pages = []
            for page in pages:
                page_info = {
                    "page_id": page.get("id"),
                    "page_name": page.get("name"),
                    "category": page.get("category"),
                    "page_access_token": page.get("access_token"),
                    "has_instagram": False,
                }

                # Check for Instagram Business Account
                ig_account = page.get("instagram_business_account")
                if ig_account:
                    page_info["has_instagram"] = True
                    page_info["instagram_account_id"] = ig_account.get("id")
                    page_info["instagram_username"] = ig_account.get("username")
                    page_info["instagram_name"] = ig_account.get("name")

                formatted_pages.append(page_info)

            return {
                "success": True,
                "message": f"Found {len(pages)} page(s)",
                "pages": formatted_pages,
            }

    except httpx.HTTPStatusError as e:
        error_data = {}
        try:
            error_data = e.response.json()
        except:
            pass

        error_message = error_data.get("error", {}).get("message", str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to fetch pages: {error_message}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching pages: {str(e)}",
        )


@router.post("/token/test", response_model=TokenTestResponse)
async def test_token_connection(
    request: TokenTestRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Test a Facebook/Instagram access token before connecting.

    This endpoint validates the token and retrieves account information
    without saving anything to the database.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            if request.platform == PlatformType.FACEBOOK:
                # Test Facebook Page token
                if not request.page_id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Page ID is required for Facebook",
                    )

                # Get page info and token debug info
                response = await client.get(
                    f"https://graph.facebook.com/v18.0/{request.page_id}",
                    params={
                        "fields": "id,name,category,access_token",
                        "access_token": request.access_token,
                    },
                )
                response.raise_for_status()
                page_data = response.json()

                # Get token expiration info
                debug_response = await client.get(
                    "https://graph.facebook.com/v18.0/debug_token",
                    params={
                        "input_token": request.access_token,
                        "access_token": request.access_token,
                    },
                )
                debug_data = debug_response.json()
                token_info = debug_data.get("data", {})

                # Calculate expiration
                expires_at = token_info.get("expires_at", 0)
                expires_in_days = None
                if expires_at and expires_at > 0:
                    expires_in_days = max(0, (expires_at - datetime.now().timestamp()) // 86400)

                return TokenTestResponse(
                    valid=True,
                    message=f"Successfully connected to page: {page_data.get('name')}",
                    data={
                        "page_id": page_data.get("id"),
                        "page_name": page_data.get("name"),
                        "category": page_data.get("category"),
                    },
                    expires_in_days=int(expires_in_days) if expires_in_days else None,
                    scopes=token_info.get("scopes", []),
                )

            elif request.platform == PlatformType.INSTAGRAM:
                # Test Instagram Business Account token
                if not request.instagram_business_account_id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Instagram Business Account ID is required",
                    )

                # Get Instagram account info
                response = await client.get(
                    f"https://graph.facebook.com/v18.0/{request.instagram_business_account_id}",
                    params={
                        "fields": "id,username,name,profile_picture_url",
                        "access_token": request.access_token,
                    },
                )
                response.raise_for_status()
                ig_data = response.json()

                # Get token expiration info
                debug_response = await client.get(
                    "https://graph.facebook.com/v18.0/debug_token",
                    params={
                        "input_token": request.access_token,
                        "access_token": request.access_token,
                    },
                )
                debug_data = debug_response.json()
                token_info = debug_data.get("data", {})

                # Calculate expiration
                expires_at = token_info.get("expires_at", 0)
                expires_in_days = None
                if expires_at and expires_at > 0:
                    expires_in_days = max(0, (expires_at - datetime.now().timestamp()) // 86400)

                return TokenTestResponse(
                    valid=True,
                    message=f"Successfully connected to Instagram: @{ig_data.get('username')}",
                    data={
                        "account_id": ig_data.get("id"),
                        "username": ig_data.get("username"),
                        "name": ig_data.get("name"),
                    },
                    expires_in_days=int(expires_in_days) if expires_in_days else None,
                    scopes=token_info.get("scopes", []),
                )

            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Token connection not supported for {request.platform}",
                )

    except httpx.HTTPStatusError as e:
        error_data = {}
        try:
            error_data = e.response.json()
        except:
            pass

        error_message = error_data.get("error", {}).get("message", str(e))
        return TokenTestResponse(
            valid=False,
            message=f"Token validation failed: {error_message}",
            data=error_data,
        )
    except Exception as e:
        return TokenTestResponse(
            valid=False,
            message=f"Connection test failed: {str(e)}",
        )


@router.post("/token/connect", response_model=TokenConnectionResponse)
async def connect_with_token(
    request: TokenConnectionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Connect a Facebook or Instagram account using an access token.

    This endpoint is specifically for Facebook and Instagram which use
    long-lived access tokens instead of OAuth flow.
    """
    # Validate platform
    if request.platform not in [PlatformType.FACEBOOK, PlatformType.INSTAGRAM]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token connection is only supported for Facebook and Instagram",
        )

    try:
        # Check if account already exists
        result = await db.execute(
            select(SocialAccount).where(
                SocialAccount.user_id == current_user.id,
                SocialAccount.platform == request.platform,
            )
        )
        existing_account = result.scalar_one_or_none()

        if existing_account:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{request.platform} account already connected. Disconnect it first or update the token.",
            )

        # Verify token and get account details
        async with httpx.AsyncClient(timeout=10.0) as client:
            if request.platform == PlatformType.FACEBOOK:
                if not request.page_id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Page ID is required for Facebook",
                    )

                # Get page info
                response = await client.get(
                    f"https://graph.facebook.com/v18.0/{request.page_id}",
                    params={
                        "fields": "id,name,category",
                        "access_token": request.access_token,
                    },
                )
                response.raise_for_status()
                page_data = response.json()

                # Get token expiration info
                debug_response = await client.get(
                    "https://graph.facebook.com/v18.0/debug_token",
                    params={
                        "input_token": request.access_token,
                        "access_token": request.access_token,
                    },
                )
                debug_data = debug_response.json()
                token_info = debug_data.get("data", {})

                expires_at = token_info.get("expires_at", 0)
                expires_in_days = None
                token_expires_at = None
                if expires_at and expires_at > 0:
                    token_expires_at = datetime.fromtimestamp(expires_at)
                    expires_in_days = max(0, int((expires_at - datetime.now().timestamp()) // 86400))

                # Create social account
                new_account = SocialAccount(
                    user_id=current_user.id,
                    platform=PlatformType.FACEBOOK,
                    platform_user_id=page_data.get("id"),
                    username=None,
                    display_name=page_data.get("name"),
                    access_token=request.access_token,
                    token_expires_at=token_expires_at,
                    platform_data={
                        "page_id": page_data.get("id"),
                        "page_name": page_data.get("name"),
                        "category": page_data.get("category"),
                        "scopes": token_info.get("scopes", []),
                    },
                    is_active=True,
                    is_connected=True,
                )

                db.add(new_account)
                await db.commit()
                await db.refresh(new_account)

                return TokenConnectionResponse(
                    success=True,
                    message=f"Successfully connected Facebook page: {page_data.get('name')}",
                    account_id=new_account.id,
                    platform=PlatformType.FACEBOOK,
                    display_name=page_data.get("name"),
                    platform_user_id=page_data.get("id"),
                    expires_in_days=expires_in_days,
                )

            elif request.platform == PlatformType.INSTAGRAM:
                if not request.instagram_business_account_id:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Instagram Business Account ID is required",
                    )

                # Get Instagram account info
                response = await client.get(
                    f"https://graph.facebook.com/v18.0/{request.instagram_business_account_id}",
                    params={
                        "fields": "id,username,name",
                        "access_token": request.access_token,
                    },
                )
                response.raise_for_status()
                ig_data = response.json()

                # Get token expiration info
                debug_response = await client.get(
                    "https://graph.facebook.com/v18.0/debug_token",
                    params={
                        "input_token": request.access_token,
                        "access_token": request.access_token,
                    },
                )
                debug_data = debug_response.json()
                token_info = debug_data.get("data", {})

                expires_at = token_info.get("expires_at", 0)
                expires_in_days = None
                token_expires_at = None
                if expires_at and expires_at > 0:
                    token_expires_at = datetime.fromtimestamp(expires_at)
                    expires_in_days = max(0, int((expires_at - datetime.now().timestamp()) // 86400))

                # Create social account
                new_account = SocialAccount(
                    user_id=current_user.id,
                    platform=PlatformType.INSTAGRAM,
                    platform_user_id=ig_data.get("id"),
                    username=ig_data.get("username"),
                    display_name=ig_data.get("name"),
                    access_token=request.access_token,
                    token_expires_at=token_expires_at,
                    platform_data={
                        "instagram_business_account_id": ig_data.get("id"),
                        "username": ig_data.get("username"),
                        "name": ig_data.get("name"),
                        "scopes": token_info.get("scopes", []),
                    },
                    is_active=True,
                    is_connected=True,
                )

                db.add(new_account)
                await db.commit()
                await db.refresh(new_account)

                return TokenConnectionResponse(
                    success=True,
                    message=f"Successfully connected Instagram: @{ig_data.get('username')}",
                    account_id=new_account.id,
                    platform=PlatformType.INSTAGRAM,
                    username=ig_data.get("username"),
                    display_name=ig_data.get("name"),
                    platform_user_id=ig_data.get("id"),
                    expires_in_days=expires_in_days,
                )

    except httpx.HTTPStatusError as e:
        error_data = {}
        try:
            error_data = e.response.json()
        except:
            pass

        error_message = error_data.get("error", {}).get("message", str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to connect account: {error_message}",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error connecting account: {str(e)}",
        )

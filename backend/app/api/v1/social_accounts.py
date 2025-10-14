from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional, Dict
from datetime import datetime
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.social_account import SocialAccount, PlatformType
from app.api.v1.auth import get_current_user


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
    db: AsyncSession = Depends(get_db)
):
    """Connect a new social media account."""
    
    # Check if account already exists
    result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.user_id == current_user.id,
            SocialAccount.platform == account_data.platform
        )
    )
    existing_account = result.scalar_one_or_none()
    
    if existing_account:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{account_data.platform} account already connected"
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
        is_connected=True
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
    db: AsyncSession = Depends(get_db)
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
    db: AsyncSession = Depends(get_db)
):
    """Get specific social media account."""
    result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.id == account_id,
            SocialAccount.user_id == current_user.id
        )
    )
    account = result.scalar_one_or_none()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Social account not found"
        )
    
    return account


@router.put("/{account_id}", response_model=SocialAccountResponse)
async def update_social_account(
    account_id: int,
    update_data: SocialAccountUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update social media account details."""
    result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.id == account_id,
            SocialAccount.user_id == current_user.id
        )
    )
    account = result.scalar_one_or_none()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Social account not found"
        )
    
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
    db: AsyncSession = Depends(get_db)
):
    """Disconnect/delete a social media account."""
    result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.id == account_id,
            SocialAccount.user_id == current_user.id
        )
    )
    account = result.scalar_one_or_none()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Social account not found"
        )
    
    await db.delete(account)
    await db.commit()
    
    return None


@router.post("/{account_id}/refresh-token", response_model=SocialAccountResponse)
async def refresh_account_token(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Refresh access token for a social media account."""
    result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.id == account_id,
            SocialAccount.user_id == current_user.id
        )
    )
    account = result.scalar_one_or_none()
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Social account not found"
        )
    
    # TODO: Implement platform-specific token refresh logic
    # This would call the respective OAuth provider's token refresh endpoint
    
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Token refresh not yet implemented for this platform"
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
                "color": "#1877F2"
            },
            {
                "name": "Instagram",
                "value": "instagram",
                "icon": "instagram",
                "color": "#E4405F"
            },
            {
                "name": "LinkedIn",
                "value": "linkedin",
                "icon": "linkedin",
                "color": "#0A66C2"
            },
            {
                "name": "Twitter / X",
                "value": "twitter",
                "icon": "twitter",
                "color": "#000000"
            },
            {
                "name": "TikTok",
                "value": "tiktok",
                "icon": "tiktok",
                "color": "#000000"
            }
        ]
    }
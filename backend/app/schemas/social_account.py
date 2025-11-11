from pydantic import BaseModel, Field
from typing import Optional, Dict
from datetime import datetime
from app.models.social_account import PlatformType


class TokenConnectionRequest(BaseModel):
    """Schema for connecting Facebook/Instagram with access token"""

    platform: PlatformType = Field(..., description="Platform type (facebook or instagram)")
    access_token: str = Field(..., description="Access token from Facebook/Instagram")
    page_id: Optional[str] = Field(None, description="Facebook Page ID (required for Facebook)")
    instagram_business_account_id: Optional[str] = Field(
        None, description="Instagram Business Account ID (required for Instagram)"
    )


class TokenConnectionResponse(BaseModel):
    """Response after successful token connection"""

    success: bool
    message: str
    account_id: int
    platform: PlatformType
    username: Optional[str] = None
    display_name: Optional[str] = None
    platform_user_id: Optional[str] = None
    expires_in_days: Optional[int] = None


class TokenTestRequest(BaseModel):
    """Schema for testing a token connection"""

    access_token: str = Field(..., description="Access token to test")
    platform: PlatformType = Field(..., description="Platform type (facebook or instagram)")
    page_id: Optional[str] = Field(None, description="Facebook Page ID (for Facebook)")
    instagram_business_account_id: Optional[str] = Field(None, description="Instagram Business Account ID (for Instagram)")


class TokenTestResponse(BaseModel):
    """Response from token test"""

    valid: bool
    message: str
    data: Optional[Dict] = None
    expires_in_days: Optional[int] = None
    scopes: Optional[list] = None

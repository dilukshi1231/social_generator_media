from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime
from app.models.user import UserType


# Base schema with common fields
class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: Optional[str] = None
    user_type: UserType = UserType.INDIVIDUAL
    business_name: Optional[str] = None
    business_description: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None


# Schema for user creation
class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    
    @field_validator('password')
    @classmethod
    def validate_password_bytes(cls, v: str) -> str:
        """Ensure password doesn't exceed 72 bytes (bcrypt limit)."""
        password_bytes = v.encode('utf-8')
        if len(password_bytes) > 72:
            # Truncate to 72 bytes and decode safely
            password_bytes = password_bytes[:72]
            v = password_bytes.decode('utf-8', errors='ignore')
        return v


# Schema for user update
class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    business_name: Optional[str] = None
    business_description: Optional[str] = None
    industry: Optional[str] = None
    website: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8)
    
    @field_validator('password')
    @classmethod
    def validate_password_bytes(cls, v: Optional[str]) -> Optional[str]:
        """Ensure password doesn't exceed 72 bytes (bcrypt limit)."""
        if v is None:
            return v
        password_bytes = v.encode('utf-8')
        if len(password_bytes) > 72:
            # Truncate to 72 bytes and decode safely
            password_bytes = password_bytes[:72]
            v = password_bytes.decode('utf-8', errors='ignore')
        return v


# Schema for user in database (response)
class User(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    is_premium: bool
    created_at: datetime
    updated_at: Optional[datetime]
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True


# Schema for user login
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# Schema for token response
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


# Schema for token data
class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None
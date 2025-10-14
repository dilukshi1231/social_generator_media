from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class PlatformType(str, enum.Enum):
    INSTAGRAM = "instagram"
    LINKEDIN = "linkedin"
    TWITTER = "twitter"
    TIKTOK = "tiktok"
    FACEBOOK = "facebook"


class SocialAccount(Base):
    __tablename__ = "social_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Platform info
    platform = Column(SQLEnum(PlatformType), nullable=False)
    platform_user_id = Column(String, nullable=True)
    username = Column(String, nullable=True)
    display_name = Column(String, nullable=True)
    
    # Authentication
    access_token = Column(String, nullable=True)
    refresh_token = Column(String, nullable=True)
    token_expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Additional platform-specific data
    platform_data = Column(JSON, nullable=True)  # Store extra info as JSON
    
    # Status
    is_active = Column(Boolean, default=True)
    is_connected = Column(Boolean, default=True)
    
    # Timestamps
    connected_at = Column(DateTime(timezone=True), server_default=func.now())
    last_posted_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="social_accounts")
    posts = relationship("Post", back_populates="social_account", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<SocialAccount {self.platform} - {self.username}>"
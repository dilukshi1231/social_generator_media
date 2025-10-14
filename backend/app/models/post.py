from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from app.models.social_account import PlatformType
import enum

class PostStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    POSTING = "posting"
    PUBLISHED = "published"
    FAILED = "failed"

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content_id = Column(Integer, ForeignKey("contents.id", ondelete="CASCADE"), nullable=False)
    social_account_id = Column(Integer, ForeignKey("social_accounts.id", ondelete="CASCADE"), nullable=False)

    # Post details
    platform = Column(SQLEnum(PlatformType), nullable=False)
    caption = Column(Text, nullable=False)
    image_url = Column(String, nullable=True)

    # Platform-specific post ID
    platform_post_id = Column(String, nullable=True)
    platform_post_url = Column(String, nullable=True)

    # Status
    status = Column(SQLEnum(PostStatus), default=PostStatus.SCHEDULED)

    # Scheduling
    scheduled_for = Column(DateTime(timezone=True), nullable=True)
    posted_at = Column(DateTime(timezone=True), nullable=True)

    # Error handling
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)

    # Analytics (optional)
    likes_count = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    shares_count = Column(Integer, default=0)
    impressions_count = Column(Integer, default=0)

    # Metadata - RENAMED from 'metadata' to 'extra_data'
    extra_data = Column(JSON, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="posts")
    content = relationship("Content", back_populates="posts")
    social_account = relationship("SocialAccount", back_populates="posts")

    def __repr__(self):
        return f"<Post {self.id} - {self.platform} - {self.status}>"
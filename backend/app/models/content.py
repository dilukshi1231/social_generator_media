from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class ContentStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    PUBLISHED = "published"
    FAILED = "failed"

class Content(Base):
    __tablename__ = "contents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Content details
    topic = Column(String, nullable=False)

    # Captions for different platforms
    facebook_caption = Column(Text, nullable=True)
    instagram_caption = Column(Text, nullable=True)
    linkedin_caption = Column(Text, nullable=True)
    pinterest_caption = Column(Text, nullable=True)
    twitter_caption = Column(String(280), nullable=True)  # Twitter char limit
    threads_caption = Column(String(500), nullable=True)  # Threads char limit

    # Image data
    image_prompt = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)
    image_data = Column(Text, nullable=True)  # Base64 encoded image

    # Status and approval
    status = Column(SQLEnum(ContentStatus), default=ContentStatus.DRAFT)
    approval_requested_at = Column(DateTime(timezone=True), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Metadata - RENAMED from 'metadata' to 'extra_data'
    extra_data = Column(JSON, nullable=True)  # Additional data

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    # Relationships
    user = relationship("User", back_populates="contents", foreign_keys=[user_id])
    approver = relationship("User", foreign_keys=[approved_by])  # Add this line
    posts = relationship("Post", back_populates="content", cascade="all, delete-orphan")
    def __repr__(self):
        return f"<Content {self.id} - {self.topic}>"
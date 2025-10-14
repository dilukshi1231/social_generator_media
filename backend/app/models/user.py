from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class UserType(str, enum.Enum):
    INDIVIDUAL = "individual"
    BUSINESS = "business"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    
    # User type
    user_type = Column(SQLEnum(UserType), default=UserType.INDIVIDUAL)
    
    # Business info (if applicable)
    business_name = Column(String, nullable=True)
    business_description = Column(String, nullable=True)
    industry = Column(String, nullable=True)
    website = Column(String, nullable=True)
    
    # Account status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    is_premium = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    # Relationships
    social_accounts = relationship("SocialAccount", back_populates="user", cascade="all, delete-orphan")

# Specify foreign_keys to avoid ambiguity
    contents = relationship(
    "Content", 
    back_populates="user", 
    foreign_keys="[Content.user_id]",
    cascade="all, delete-orphan"
)

    posts = relationship("Post", back_populates="user", cascade="all, delete-orphan")
    def __repr__(self):
        return f"<User {self.username}>"
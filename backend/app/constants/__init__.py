"""
Application constants and enumerations.
Centralized location for all hardcoded values used across the application.
"""

from enum import Enum


class Platform(str, Enum):
    """Social media platforms supported by the application."""

    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    LINKEDIN = "linkedin"
    TWITTER = "twitter"
    THREADS = "threads"
    TIKTOK = "tiktok"
    PINTEREST = "pinterest"


class ContentStatus(str, Enum):
    """Content generation and approval statuses."""

    DRAFT = "draft"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    ARCHIVED = "archived"


class PostStatus(str, Enum):
    """Post publishing statuses."""

    SCHEDULED = "scheduled"
    PUBLISHING = "publishing"
    PUBLISHED = "published"
    FAILED = "failed"
    CANCELLED = "cancelled"


class UserType(str, Enum):
    """User account types."""

    INDIVIDUAL = "individual"
    BUSINESS = "business"
    AGENCY = "agency"
    ENTERPRISE = "enterprise"


class AIProvider(str, Enum):
    """AI service providers for content generation."""

    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GEMINI = "gemini"
    REPLICATE = "replicate"


# Platform-specific configuration
PLATFORM_CONFIG = {
    Platform.FACEBOOK: {
        "max_caption_length": 63206,
        "max_hashtags": 30,
        "supports_image": True,
        "supports_video": True,
        "supports_carousel": True,
    },
    Platform.INSTAGRAM: {
        "max_caption_length": 2200,
        "max_hashtags": 30,
        "supports_image": True,
        "supports_video": True,
        "supports_carousel": True,
    },
    Platform.LINKEDIN: {
        "max_caption_length": 3000,
        "max_hashtags": 10,
        "supports_image": True,
        "supports_video": True,
        "supports_carousel": True,
    },
    Platform.TWITTER: {
        "max_caption_length": 280,
        "max_hashtags": 10,
        "supports_image": True,
        "supports_video": True,
        "supports_carousel": False,
    },
    Platform.THREADS: {
        "max_caption_length": 500,
        "max_hashtags": 10,
        "supports_image": True,
        "supports_video": True,
        "supports_carousel": False,
    },
    Platform.TIKTOK: {
        "max_caption_length": 2200,
        "max_hashtags": 30,
        "supports_image": True,
        "supports_video": True,
        "supports_carousel": False,
    },
    Platform.PINTEREST: {
        "max_caption_length": 500,
        "max_hashtags": 20,
        "supports_image": True,
        "supports_video": True,
        "supports_carousel": False,
    },
}

# OAuth scopes by platform
OAUTH_SCOPES = {
    Platform.FACEBOOK: [
        "pages_show_list",
        "pages_read_engagement",
        "pages_manage_posts",
        "publish_to_groups",
    ],
    Platform.INSTAGRAM: [
        "instagram_basic",
        "instagram_content_publish",
        "pages_show_list",
        "pages_read_engagement",
    ],
    Platform.LINKEDIN: [
        "openid",
        "profile",
        "email",
        "w_member_social",
    ],
    Platform.TWITTER: [
        "tweet.read",
        "tweet.write",
        "users.read",
        "offline.access",
    ],
    Platform.TIKTOK: [
        "user.info.basic",
        "video.list",
        "video.upload",
    ],
}

# API rate limits (requests per hour)
RATE_LIMITS = {
    "default": 1000,
    "content_generation": 100,
    "image_generation": 50,
    "post_creation": 200,
    "oauth_operations": 50,
}

# File upload constraints
MAX_IMAGE_SIZE_MB = 10
MAX_VIDEO_SIZE_MB = 100
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv"}

# Pagination defaults
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

# Cache TTLs (in seconds)
CACHE_TTL = {
    "user_profile": 300,  # 5 minutes
    "social_accounts": 60,  # 1 minute
    "content_list": 30,  # 30 seconds
    "platform_config": 3600,  # 1 hour
}

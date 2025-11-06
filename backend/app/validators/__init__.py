"""
Custom validators for additional validation logic.
These validators are used alongside Pydantic schemas for complex validation.
"""

import re
from typing import Optional
from app.constants import PLATFORM_CONFIG
from app.exceptions import ValidationError


def validate_email(email: str) -> str:
    """
    Validate email format.

    Args:
        email: Email address to validate

    Returns:
        Validated email in lowercase

    Raises:
        ValidationError: If email format is invalid
    """
    email = email.lower().strip()
    email_regex = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"

    if not re.match(email_regex, email):
        raise ValidationError("Invalid email format")

    return email


def validate_username(username: str) -> str:
    """
    Validate username format.

    Args:
        username: Username to validate

    Returns:
        Validated username

    Raises:
        ValidationError: If username format is invalid
    """
    username = username.strip()

    if len(username) < 3:
        raise ValidationError("Username must be at least 3 characters long")

    if len(username) > 30:
        raise ValidationError("Username must not exceed 30 characters")

    if not re.match(r"^[a-zA-Z0-9_-]+$", username):
        raise ValidationError(
            "Username can only contain letters, numbers, underscores, and hyphens"
        )

    return username


def validate_password(password: str) -> None:
    """
    Validate password strength.

    Args:
        password: Password to validate

    Raises:
        ValidationError: If password doesn't meet requirements
    """
    if len(password) < 8:
        raise ValidationError("Password must be at least 8 characters long")

    if not re.search(r"[A-Z]", password):
        raise ValidationError("Password must contain at least one uppercase letter")

    if not re.search(r"[a-z]", password):
        raise ValidationError("Password must contain at least one lowercase letter")

    if not re.search(r"[0-9]", password):
        raise ValidationError("Password must contain at least one number")


def validate_platform(platform: str) -> str:
    """
    Validate social media platform.

    Args:
        platform: Platform name to validate

    Returns:
        Validated platform name in lowercase

    Raises:
        ValidationError: If platform is not supported
    """
    platform = platform.lower().strip()

    if platform not in PLATFORM_CONFIG:
        supported = ", ".join(PLATFORM_CONFIG.keys())
        raise ValidationError(
            f"Unsupported platform '{platform}'. Supported platforms: {supported}"
        )

    return platform


def validate_caption_length(caption: str, platform: str) -> None:
    """
    Validate caption length for specific platform.

    Args:
        caption: Caption text to validate
        platform: Platform name

    Raises:
        ValidationError: If caption exceeds platform limit
    """
    platform = platform.lower()

    if platform not in PLATFORM_CONFIG:
        return

    max_length = PLATFORM_CONFIG[platform]["max_caption_length"]

    if len(caption) > max_length:
        raise ValidationError(
            f"Caption for {platform} exceeds maximum length of {max_length} characters"
        )


def validate_image_url(url: Optional[str]) -> Optional[str]:
    """
    Validate image URL format.

    Args:
        url: Image URL to validate

    Returns:
        Validated URL or None

    Raises:
        ValidationError: If URL format is invalid
    """
    if not url:
        return None

    url = url.strip()

    # Basic URL validation
    url_regex = r'^https?://[^\s<>"{}|\\^`\[\]]+$'
    if not re.match(url_regex, url):
        raise ValidationError("Invalid URL format")

    # Check for common image extensions
    image_extensions = (".jpg", ".jpeg", ".png", ".gif", ".webp")
    if not any(url.lower().endswith(ext) for ext in image_extensions):
        # It's okay if URL doesn't end with extension (could be dynamic URL)
        pass

    return url


def validate_oauth_code(code: str) -> str:
    """
    Validate OAuth authorization code.

    Args:
        code: OAuth code to validate

    Returns:
        Validated code

    Raises:
        ValidationError: If code is empty or invalid
    """
    code = code.strip()

    if not code:
        raise ValidationError("OAuth code is required")

    if len(code) < 10:
        raise ValidationError("Invalid OAuth code format")

    return code


def validate_topic(topic: str) -> str:
    """
    Validate content topic.

    Args:
        topic: Topic text to validate

    Returns:
        Validated topic

    Raises:
        ValidationError: If topic is too short or too long
    """
    topic = topic.strip()

    if len(topic) < 3:
        raise ValidationError("Topic must be at least 3 characters long")

    if len(topic) > 500:
        raise ValidationError("Topic must not exceed 500 characters")

    return topic


def validate_platform_list(platforms: list[str]) -> list[str]:
    """
    Validate list of platforms.

    Args:
        platforms: List of platform names

    Returns:
        Validated list of platform names

    Raises:
        ValidationError: If platforms list is empty or contains invalid platforms
    """
    if not platforms:
        raise ValidationError("At least one platform must be selected")

    validated = []
    for platform in platforms:
        validated.append(validate_platform(platform))

    # Remove duplicates while preserving order
    seen = set()
    unique_platforms = []
    for platform in validated:
        if platform not in seen:
            seen.add(platform)
            unique_platforms.append(platform)

    return unique_platforms

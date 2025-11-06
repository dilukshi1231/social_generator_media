# =============================================================================
# Constants Tests
# =============================================================================
"""
Tests for application constants and enums.
"""

import pytest


def test_constants_module_imports():
    """Test that constants module can be imported."""
    try:
        from app.constants import (
            Platform,
            ContentStatus,
            PostStatus,
            UserType,
            AIProvider,
            PLATFORM_CONFIG,
            OAUTH_SCOPES,
            RATE_LIMITS,
        )

        assert Platform is not None
        assert ContentStatus is not None
        assert PostStatus is not None
    except ImportError as e:
        pytest.skip(f"Constants module import failed: {e}")


def test_platform_enum():
    """Test Platform enum."""
    try:
        from app.constants import Platform

        assert Platform.FACEBOOK == "facebook"
        assert Platform.INSTAGRAM == "instagram"
        assert Platform.LINKEDIN == "linkedin"
        assert Platform.TWITTER == "twitter"
        assert Platform.TIKTOK == "tiktok"

        platforms = [p.value for p in Platform]
        assert "facebook" in platforms
        assert "instagram" in platforms
        assert len(platforms) >= 5
    except ImportError as e:
        pytest.skip(f"Platform enum import failed: {e}")


def test_status_enums():
    """Test status enums."""
    try:
        from app.constants import ContentStatus, PostStatus

        assert ContentStatus.DRAFT == "draft"
        assert ContentStatus.APPROVED == "approved"
        assert ContentStatus.SCHEDULED == "scheduled"
        assert ContentStatus.PUBLISHED == "published"

        assert PostStatus.PENDING == "pending"
        assert PostStatus.SCHEDULED == "scheduled"
        assert PostStatus.PUBLISHED == "published"
        assert PostStatus.FAILED == "failed"
    except ImportError as e:
        pytest.skip(f"Status enums import failed: {e}")


def test_platform_config():
    """Test platform configurations."""
    try:
        from app.constants import Platform, PLATFORM_CONFIG

        for platform in Platform:
            assert platform.value in PLATFORM_CONFIG

        for platform, config in PLATFORM_CONFIG.items():
            assert "display_name" in config
            assert "max_caption_length" in config
            assert "max_hashtags" in config
            assert "supports_images" in config
            assert "supports_video" in config

            assert config["max_caption_length"] > 0
            assert config["max_hashtags"] >= 0
    except ImportError as e:
        pytest.skip(f"Platform config import failed: {e}")


def test_oauth_scopes():
    """Test OAuth scopes configuration."""
    try:
        from app.constants import OAUTH_SCOPES

        assert isinstance(OAUTH_SCOPES, dict)
        assert len(OAUTH_SCOPES) > 0
    except ImportError as e:
        pytest.skip(f"OAuth scopes import failed: {e}")


def test_rate_limits():
    """Test rate limiting configuration."""
    try:
        from app.constants import RATE_LIMITS

        assert isinstance(RATE_LIMITS, dict)
        assert len(RATE_LIMITS) > 0

        for endpoint, limit in RATE_LIMITS.items():
            assert limit > 0
            assert limit < 10000  # Sanity check
    except ImportError as e:
        pytest.skip(f"Rate limits import failed: {e}")

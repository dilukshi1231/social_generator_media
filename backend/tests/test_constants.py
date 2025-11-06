# =============================================================================
# Constants Tests
# =============================================================================
"""
Tests for application constants and enums.
"""

import pytest
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


class TestPlatformEnum:
    """Test Platform enum."""

    def test_platform_values(self):
        """Test that all platforms have expected values."""
        assert Platform.FACEBOOK == "facebook"
        assert Platform.INSTAGRAM == "instagram"
        assert Platform.LINKEDIN == "linkedin"
        assert Platform.TWITTER == "twitter"
        assert Platform.TIKTOK == "tiktok"

    def test_platform_list(self):
        """Test getting all platform values."""
        platforms = [p.value for p in Platform]
        assert "facebook" in platforms
        assert "instagram" in platforms
        assert len(platforms) >= 5


class TestStatusEnums:
    """Test status enums."""

    def test_content_status(self):
        """Test ContentStatus enum."""
        assert ContentStatus.DRAFT == "draft"
        assert ContentStatus.APPROVED == "approved"
        assert ContentStatus.SCHEDULED == "scheduled"
        assert ContentStatus.PUBLISHED == "published"

    def test_post_status(self):
        """Test PostStatus enum."""
        assert PostStatus.PENDING == "pending"
        assert PostStatus.SCHEDULED == "scheduled"
        assert PostStatus.PUBLISHED == "published"
        assert PostStatus.FAILED == "failed"


class TestPlatformConfig:
    """Test platform configurations."""

    def test_all_platforms_configured(self):
        """Test that all platforms have configuration."""
        for platform in Platform:
            assert platform.value in PLATFORM_CONFIG

    def test_platform_config_structure(self):
        """Test platform config has required fields."""
        for platform, config in PLATFORM_CONFIG.items():
            assert "display_name" in config
            assert "max_caption_length" in config
            assert "max_hashtags" in config
            assert "supports_images" in config
            assert "supports_video" in config

    def test_platform_limits(self):
        """Test platform limits are reasonable."""
        for platform, config in PLATFORM_CONFIG.items():
            assert config["max_caption_length"] > 0
            assert config["max_hashtags"] >= 0


class TestOAuthScopes:
    """Test OAuth scopes configuration."""

    def test_oauth_scopes_exist(self):
        """Test that OAuth scopes are defined."""
        assert isinstance(OAUTH_SCOPES, dict)
        assert len(OAUTH_SCOPES) > 0

    def test_oauth_scopes_structure(self):
        """Test OAuth scopes have required platforms."""
        for platform in Platform:
            if platform.value in OAUTH_SCOPES:
                scopes = OAUTH_SCOPES[platform.value]
                assert isinstance(scopes, list)


class TestRateLimits:
    """Test rate limiting configuration."""

    def test_rate_limits_exist(self):
        """Test that rate limits are defined."""
        assert isinstance(RATE_LIMITS, dict)
        assert len(RATE_LIMITS) > 0

    def test_rate_limits_reasonable(self):
        """Test that rate limits are reasonable values."""
        for endpoint, limit in RATE_LIMITS.items():
            assert limit > 0
            assert limit < 10000  # Sanity check

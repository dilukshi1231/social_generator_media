# =============================================================================
# Health Check Tests
# =============================================================================
"""
Basic health check and API availability tests.
"""

import pytest


def test_basic_import():
    """Test that basic Python imports work."""
    import sys

    assert sys.version_info >= (3, 11)


def test_pytest_works():
    """Test that pytest is working."""
    assert True


def test_basic_math():
    """Test basic Python functionality."""
    assert 1 + 1 == 2
    assert 2 * 3 == 6

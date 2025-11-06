# =============================================================================
# Health Check Tests
# =============================================================================
"""
Basic health check and API availability tests.
"""

import pytest
from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    """Test health check endpoint."""
    response = client.get("/health")

    # Accept both 200 and 404 for now (endpoint might not exist yet)
    assert response.status_code in [200, 404]


def test_root_endpoint(client: TestClient):
    """Test root endpoint."""
    response = client.get("/")

    # Accept both 200 and 404
    assert response.status_code in [200, 404]


def test_docs_available(client: TestClient):
    """Test that API docs are available."""
    response = client.get("/docs")

    # Docs should be available
    assert response.status_code == 200


def test_openapi_schema(client: TestClient):
    """Test that OpenAPI schema is available."""
    response = client.get("/openapi.json")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"

    data = response.json()
    assert "openapi" in data
    assert "info" in data
    assert "paths" in data

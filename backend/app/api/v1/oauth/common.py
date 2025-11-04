from typing import Dict, Tuple

# Simple in-memory state store for demo/dev; for production, persist per-user (e.g., Redis)
_oauth_state_store: Dict[str, int] = {}

# Store code_verifier for PKCE (e.g., TikTok). Value is tuple(code_verifier, timestamp)
_pkce_store: Dict[str, Tuple[str, float]] = {}

# Default TTL for PKCE entries (seconds)
_PKCE_TTL_SECONDS = 300

__all__ = [
    "_oauth_state_store",
    "_pkce_store",
    "_PKCE_TTL_SECONDS",
]

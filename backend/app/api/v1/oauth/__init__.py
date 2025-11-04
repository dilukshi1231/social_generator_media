from fastapi import APIRouter

from .facebook import router as facebook_router
from .instagram import router as instagram_router
from .linkedin import router as linkedin_router
from .twitter import router as twitter_router
from .tiktok import router as tiktok_router
from .generic import router as generic_router

# Top-level router for /api/v1/oauth
router = APIRouter()

# Mount provider routers without extra prefixes to keep existing paths
router.include_router(facebook_router)
router.include_router(instagram_router)
router.include_router(linkedin_router)
router.include_router(twitter_router)
router.include_router(tiktok_router)
router.include_router(generic_router)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pathlib import Path

from app.core.config import settings
from app.database import create_tables
from loguru import logger

# Import routers
from app.api.v1 import (
    auth,
    content,
    social_accounts,
    posts,
)
from app.api.v1 import oauth as oauth_routes


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown."""
    # Startup
    logger.info("Starting up application...")
    # Create tables if in development mode
    if settings.DEBUG:
        logger.info("Creating database tables...")
        await create_tables()

    # Create uploads directory if it doesn't exist
    upload_dir = Path("uploads/images")
    upload_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"Uploads directory ready: {upload_dir.absolute()}")

    yield

    # Shutdown
    logger.info("Shutting down application...")


# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Social Media Automation Platform API",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Social Media Automation API",
        "version": settings.APP_VERSION,
        "status": "running",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "version": settings.APP_VERSION}


# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(content.router, prefix="/api/v1/content", tags=["Content"])
app.include_router(
    social_accounts.router, prefix="/api/v1/social-accounts", tags=["Social Accounts"]
)  # ADD THIS
app.include_router(posts.router, prefix="/api/v1/posts", tags=["Posts"])  # ADD THIS
app.include_router(
    oauth_routes.router, prefix="/api/v1/oauth", tags=["OAuth"]
)  # New OAuth routes

# Mount static files for serving uploaded images
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/uploads/videos", StaticFiles(directory="uploads/videos"), name="videos")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )

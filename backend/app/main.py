from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pathlib import Path
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
import time

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

    # Create videos directory
    videos_dir = Path("uploads/videos")
    videos_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"Videos directory ready: {videos_dir.absolute()}")

    # Create audio directory
    audio_dir = Path("uploads/audio")
    audio_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"Audio directory ready: {audio_dir.absolute()}")

    # Create subtitles directory
    subtitles_dir = Path("uploads/subtitles")
    subtitles_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"Subtitles directory ready: {subtitles_dir.absolute()}")

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


# Request logging middleware
class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        print(f"\n{'='*80}")
        print(f"[REQUEST] {request.method} {request.url.path}")
        print(f"[REQUEST] Headers: {dict(request.headers)}")

        # Try to get body for POST requests
        if request.method == "POST":
            body = await request.body()
            print(f"[REQUEST] Body length: {len(body)} bytes")
            if len(body) < 5000:  # Only print small bodies
                print(f"[REQUEST] Body preview: {body[:500]}")

        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time

        print(f"[RESPONSE] Status: {response.status_code}")
        print(f"[RESPONSE] Time: {process_time:.3f}s")

        # Try to read response body for errors
        if response.status_code >= 400:
            # Get response body
            response_body = b""
            async for chunk in response.body_iterator:
                response_body += chunk
            print(f"[RESPONSE] Error body: {response_body.decode()}")

            # Re-create response with same body
            from starlette.responses import Response

            response = Response(
                content=response_body,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type,
            )

        print(f"{'='*80}\n")

        return response


app.add_middleware(RequestLoggingMiddleware)


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
)
app.include_router(posts.router, prefix="/api/v1/posts", tags=["Posts"])
app.include_router(
    oauth_routes.router, prefix="/api/v1/oauth", tags=["OAuth"]
)

# Mount static files for serving uploaded images, videos, audio, and subtitles
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
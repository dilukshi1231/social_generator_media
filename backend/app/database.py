from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from typing import AsyncGenerator, Optional
from app.core.config import settings
import re

# Async engine for FastAPI
async_engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True,
    pool_size=getattr(settings, "DB_POOL_SIZE", 10),
    max_overflow=getattr(settings, "DB_MAX_OVERFLOW", 20),
    pool_timeout=getattr(settings, "DB_POOL_TIMEOUT", 30),
    pool_recycle=getattr(settings, "DB_POOL_RECYCLE", 1800),
)


# Sync engine for Alembic migrations
def _derive_sync_url(async_url: str) -> str:
    """Derive a sync DB URL from the async URL by removing async driver suffix.

    Example: postgresql+asyncpg:// -> postgresql://
    """
    # Remove +driver (like +asyncpg)
    return re.sub(r"\+\w+", r"", async_url)


# Determine sync URL: prefer explicit setting, otherwise derive
sync_url: Optional[str] = None
if getattr(settings, "DATABASE_URL_SYNC", None):
    sync_url = settings.DATABASE_URL_SYNC
else:
    sync_url = _derive_sync_url(settings.DATABASE_URL)

sync_engine = create_engine(
    sync_url,
    echo=settings.DEBUG,
    pool_pre_ping=True,
)

# Async session maker
AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Sync session maker
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=sync_engine,
)

# Base class for models
Base = declarative_base()


# Dependency for async database sessions
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield an AsyncSession for request handlers.

    NOTE: This dependency does not automatically commit or rollback —
    route handlers should explicitly call `await db.commit()` after successful
    operations. This avoids unintended commits and gives callers control.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


# Function to create tables (for development)
async def create_tables():
    """Create all database tables."""
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# Function to drop tables (for development)
async def drop_tables():
    """Drop all database tables."""
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

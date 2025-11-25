from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from typing import AsyncGenerator
from app.core.config import settings
from loguru import logger

# Async engine for FastAPI
async_engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

# Sync engine for Alembic migrations
if settings.DATABASE_URL_SYNC:
    sync_engine = create_engine(
        settings.DATABASE_URL_SYNC,
        echo=settings.DEBUG,
        pool_pre_ping=True,
    )
else:
    sync_engine = None
    logger.warning(
        "DATABASE_URL_SYNC not set; sync engine disabled. Set DATABASE_URL_SYNC to enable sync DB sessions for Alembic/Celery."
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
if sync_engine is not None:
    SessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=sync_engine,
    )
else:

    class _MissingSession:
        def __call__(self, *args, **kwargs):
            raise RuntimeError(
                "Sync DB session requested but DATABASE_URL_SYNC is not configured. "
                "Set DATABASE_URL_SYNC in your environment to enable sync sessions (used by Alembic/Celery)."
            )

    SessionLocal = _MissingSession()

# Base class for models
Base = declarative_base()


# Dependency for async database sessions
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency function that yields database sessions.

    Yields:
        AsyncSession: Database session for FastAPI routes
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
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

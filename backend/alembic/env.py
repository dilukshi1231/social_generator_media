from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
import os
import sys

# Add the parent directory to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import Base
from app.core.config import settings

# Import all models to ensure they are registered with Base
from app.models.user import User
from app.models.social_account import SocialAccount

# Import other models as you create them

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)


# Set the SQLAlchemy URL from settings. If a sync URL isn't provided explicitly
# (settings.DATABASE_URL_SYNC), try to derive a sync URL from the async
# `DATABASE_URL` by stripping the async driver (e.g. '+asyncpg'). If neither is
# available, raise a clear error so the user can fix the environment.
def _derive_sync_url(async_url: str) -> str:
    if not async_url:
        raise RuntimeError("Cannot derive sync DB URL because `DATABASE_URL` is empty.")
    # Example: postgresql+asyncpg://user:pass@host/db -> postgresql://user:pass@host/db
    sep = "://"
    if sep in async_url:
        scheme, rest = async_url.split(sep, 1)
        if "+" in scheme:
            scheme = scheme.split("+", 1)[0]
        return f"{scheme}{sep}{rest}"
    return async_url


sync_url = settings.DATABASE_URL_SYNC
if not sync_url:
    # Try deriving from the async URL if available
    async_url = getattr(settings, "DATABASE_URL", None)
    if async_url:
        sync_url = _derive_sync_url(async_url)
    else:
        raise RuntimeError(
            "Missing DATABASE_URL_SYNC and DATABASE_URL; Alembic requires a sync DB URL. "
            "Set `DATABASE_URL_SYNC` in your environment or provide a synchronous DB URL."
        )

# configparser treats '%' as interpolation markers; escape them so passwords
# containing percent-encoded characters (e.g. '%40') don't cause errors.
config.set_main_option("sqlalchemy.url", str(sync_url).replace("%", "%%"))

# add your model's MetaData object here for 'autogenerate' support
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

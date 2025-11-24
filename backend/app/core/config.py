from functools import lru_cache
from typing import List

from pydantic import ConfigDict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Social Media Automation"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"

    HOST: str = "0.0.0.0"
    PORT: int = 8000

    DATABASE_URL: str
    DATABASE_URL_SYNC: str | None = None

    REDIS_URL: str | None = None

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    FACEBOOK_APP_ID: str = ""
    FACEBOOK_APP_SECRET: str = ""
    FACEBOOK_REDIRECT_URI: str = ""
    INSTAGRAM_REDIRECT_URI: str = ""
    TWITTER_REDIRECT_URI: str = ""
    FRONTEND_URL: str = ""
    BACKEND_URL: str = "http://localhost:8000"
    LINKEDIN_REDIRECT_URI: str = ""

    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    REPLICATE_API_TOKEN: str = ""
    GEMINI_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""

    CLOUDFLARE_WORKER_URL: str = ""
    CLOUDFLARE_WORKER_AUTH_TOKEN: str = ""

    PEXELS_API_KEY: str = ""

    TWITTER_API_KEY: str = ""
    TWITTER_API_SECRET: str = ""
    TWITTER_CLIENT_ID: str = ""
    TWITTER_CLIENT_SECRET: str = ""
    TWITTER_BEARER_TOKEN: str = ""
    INSTAGRAM_USERNAME: str = ""
    INSTAGRAM_PASSWORD: str = ""
    INSTAGRAM_APP_ID: str = ""
    INSTAGRAM_APP_SECRET: str = ""
    LINKEDIN_CLIENT_ID: str = ""
    LINKEDIN_CLIENT_SECRET: str = ""
    TIKTOK_CLIENT_KEY: str = ""
    TIKTOK_CLIENT_SECRET: str = ""
    TIKTOK_REDIRECT_URI: str = ""

    CELERY_BROKER_URL: str
    CELERY_RESULT_BACKEND: str

    CORS_ORIGINS: str = "http://localhost:3000"

    LOG_LEVEL: str = "INFO"

    SENTRY_DSN: str = ""
    ELEVENLABS_API_KEY: str = ""

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS:
            return []
        return [
            origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()
        ]

    model_config: ConfigDict = ConfigDict(
        {
            "env_file": ".env",
            "env_file_encoding": "utf-8",
            "case_sensitive": True,
            "extra": "ignore",
        }
    )


@lru_cache()
def get_settings() -> Settings:
    s = Settings()

    # Fail-fast checks for production environment
    if getattr(s, "ENVIRONMENT", "").lower() == "production":
        missing = []
        if not getattr(s, "SECRET_KEY", None):
            missing.append("SECRET_KEY")
        if not getattr(s, "DATABASE_URL", None):
            missing.append("DATABASE_URL")
        if not getattr(s, "BACKEND_URL", None):
            missing.append("BACKEND_URL")
        if not getattr(s, "FRONTEND_URL", None):
            missing.append("FRONTEND_URL")

        if missing:
            raise RuntimeError(
                f"Missing required environment variables for production: {', '.join(missing)}"
            )

    return s


settings = get_settings()

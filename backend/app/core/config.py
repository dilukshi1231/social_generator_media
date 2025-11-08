from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache
from pydantic import ConfigDict
from pydantic import Field

class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Social Media Automation"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # Database
    DATABASE_URL: str
    DATABASE_URL_SYNC: str

    # Redis
    REDIS_URL: str

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    FACEBOOK_APP_ID: str = ""
    FACEBOOK_APP_SECRET: str = ""
    FACEBOOK_REDIRECT_URI: str = ""
    INSTAGRAM_REDIRECT_URI: str = ""
    FRONTEND_URL: str = ""
    BACKEND_URL: str = "http://localhost:8000"
    LINKEDIN_REDIRECT_URI: str = ""

    # AI Services
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    REPLICATE_API_TOKEN: str = ""
    GEMINI_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""

    # Cloudflare Worker for Image Generation
    CLOUDEFARE_WORKER_URL: str = ""
    CLOUDEFARE_WORKER_AUTH_TOKEN: str = ""

    # Pexels API for Video Search
    PEXELS_API_KEY: str = ""  # ADD THIS LINE

    # Social Media
    TWITTER_API_KEY: str = ""
    TWITTER_API_SECRET: str = ""
    TWITTER_ACCESS_TOKEN: str = ""
    TWITTER_ACCESS_SECRET: str = ""
    INSTAGRAM_USERNAME: str = ""
    INSTAGRAM_PASSWORD: str = ""
    INSTAGRAM_APP_ID: str = ""
    INSTAGRAM_APP_SECRET: str = ""
    LINKEDIN_CLIENT_ID: str = ""
    LINKEDIN_CLIENT_SECRET: str = ""

    # Celery
    CELERY_BROKER_URL: str
    CELERY_RESULT_BACKEND: str

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"

    # Logging
    LOG_LEVEL: str = "INFO"

    # Sentry
    SENTRY_DSN: str = ""
    ELEVENLABS_API_KEY: str = "sk_6be242d50c8e387c45c8269b882c4ef6b5767ac5f967111e"
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    model_config: ConfigDict = ConfigDict(
        {
            "env_file": ".env",
            "case_sensitive": True,
            "extra": "ignore",
        }
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
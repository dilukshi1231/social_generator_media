"""
Logging configuration using loguru.
Centralized logging setup for the entire application.
"""

import sys
from pathlib import Path
from loguru import logger
from app.core.config import settings


def configure_logging():
    """
    Configure loguru logger with appropriate handlers and formats.
    """
    # Remove default handler
    logger.remove()

    # Console handler with colors
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | <level>{message}</level>",
        level=settings.LOG_LEVEL,
        colorize=True,
    )

    # File handler for all logs
    logs_dir = Path("logs")
    logs_dir.mkdir(exist_ok=True)

    logger.add(
        logs_dir / "app.log",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} | {message}",
        level=settings.LOG_LEVEL,
        rotation="10 MB",  # Rotate when file reaches 10MB
        retention="30 days",  # Keep logs for 30 days
        compression="zip",  # Compress rotated logs
        enqueue=True,  # Thread-safe
    )

    # Separate file for errors
    logger.add(
        logs_dir / "errors.log",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} | {message}",
        level="ERROR",
        rotation="10 MB",
        retention="90 days",  # Keep error logs longer
        compression="zip",
        enqueue=True,
        backtrace=True,  # Include traceback
        diagnose=True,  # Include variable values
    )

    # API requests log (for audit)
    logger.add(
        logs_dir / "requests.log",
        format="{time:YYYY-MM-DD HH:mm:ss} | {message}",
        level="INFO",
        rotation="50 MB",
        retention="60 days",
        compression="zip",
        enqueue=True,
        filter=lambda record: "request_id" in record["extra"],
    )

    logger.info(f"Logging configured. Level: {settings.LOG_LEVEL}")
    logger.info(f"Logs directory: {logs_dir.absolute()}")


def get_logger(name: str):
    """
    Get a logger instance with a specific name.

    Args:
        name: Logger name (usually __name__ of the module)

    Returns:
        Logger instance
    """
    return logger.bind(name=name)


# Configure logging on module import
configure_logging()

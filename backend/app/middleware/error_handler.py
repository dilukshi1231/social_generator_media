"""
Error handling middleware for consistent error responses.
"""

from typing import Union
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.exc import SQLAlchemyError
from loguru import logger

from app.exceptions import AppException


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to handle exceptions and return consistent error responses.
    """

    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response

        except AppException as exc:
            # Custom application exceptions - already have proper status codes
            return JSONResponse(
                status_code=exc.status_code,
                content={
                    "error": {
                        "type": exc.__class__.__name__,
                        "message": exc.detail,
                        "request_id": getattr(request.state, "request_id", None),
                    }
                },
                headers=exc.headers,
            )

        except RequestValidationError as exc:
            # Pydantic validation errors
            logger.warning(f"Validation error: {exc.errors()}")
            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content={
                    "error": {
                        "type": "ValidationError",
                        "message": "Request validation failed",
                        "details": exc.errors(),
                        "request_id": getattr(request.state, "request_id", None),
                    }
                },
            )

        except SQLAlchemyError as exc:
            # Database errors
            logger.error(f"Database error: {str(exc)}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "error": {
                        "type": "DatabaseError",
                        "message": "A database error occurred",
                        "request_id": getattr(request.state, "request_id", None),
                    }
                },
            )

        except Exception as exc:
            # Unexpected errors
            logger.exception(f"Unexpected error: {str(exc)}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "error": {
                        "type": "InternalServerError",
                        "message": "An unexpected error occurred",
                        "request_id": getattr(request.state, "request_id", None),
                    }
                },
            )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """
    Custom handler for request validation errors.
    Provides detailed validation error messages.
    """
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "type": "ValidationError",
                "message": "Request validation failed",
                "details": exc.errors(),
                "request_id": getattr(request.state, "request_id", None),
            }
        },
    )

"""
Health check endpoint.
"""

from fastapi import APIRouter

from app.schemas.backtest import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    Health check endpoint.

    Returns the service status and version.
    """
    return HealthResponse(status="healthy", version="1.0.0")

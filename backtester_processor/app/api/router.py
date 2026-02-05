"""
Main API router that aggregates all endpoint routers.
"""

from fastapi import APIRouter

from app.api.endpoints import health, backtest, topics

api_router = APIRouter()

api_router.include_router(health.router, tags=["health"])
api_router.include_router(backtest.router, prefix="/backtest", tags=["backtest"])
api_router.include_router(topics.router, prefix="/topics", tags=["topics"])

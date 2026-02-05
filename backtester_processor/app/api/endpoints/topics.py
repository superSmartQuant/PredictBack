"""
Topics and Markets API endpoints.
"""

from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.config import settings
from app.repository.polymarket import PolymarketRepository
from app.schemas.backtest import TopicsResponse, Topic, MarketsResponse, MarketInfo

router = APIRouter()


def get_repository() -> PolymarketRepository:
    """Get repository instance."""
    return PolymarketRepository(settings.database_url)


@router.get("/", response_model=TopicsResponse)
async def get_topics() -> TopicsResponse:
    """
    Get all available topics/categories.

    Returns a list of all topics that can be used to filter markets.
    """
    repo = get_repository()
    topics_data = repo.get_topics()

    topics = [
        Topic(
            id=t["id"],
            name=t["name"],
            continuous=t["continuous"],
            created_at=t["created_at"],
        )
        for t in topics_data
    ]

    return TopicsResponse(topics=topics, count=len(topics))


@router.get("/markets", response_model=MarketsResponse)
async def get_markets(
    topic: Optional[str] = Query(default=None, description="Filter markets by topic name")
) -> MarketsResponse:
    """
    Get all indexed markets, optionally filtered by topic.

    Args:
        topic: Optional topic name to filter markets
    """
    repo = get_repository()

    if topic:
        markets_data = repo.get_markets_by_topic(topic)
    else:
        markets_data = repo.get_indexed_markets()

    markets = [
        MarketInfo(
            clob_token_id=m["clob_token_id"],
            market_slug=m.get("market_slug"),
            question=m.get("question"),
            neg=m["neg"],
            topic=m.get("topic"),
        )
        for m in markets_data
    ]

    return MarketsResponse(markets=markets, count=len(markets))

"""
Backtest API endpoint.
"""

from fastapi import APIRouter, HTTPException

from app.schemas.backtest import BacktestRequest, BacktestResponse, ErrorResponse
from app.services.backtest_service import BacktestService
from app.core.exceptions import (
    StrategyNotFoundError,
    MarketNotFoundError,
    InsufficientDataError,
)

router = APIRouter()


@router.post(
    "/run",
    response_model=BacktestResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid request"},
        404: {"model": ErrorResponse, "description": "Market not found"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def run_backtest(request: BacktestRequest) -> BacktestResponse:
    """
    Run a backtest with the specified strategy and market.

    **Strategy options:**
    - `grid`: Grid trading strategy - profits from price oscillations in a range
    - `momentum`: Momentum strategy - follows price trends

    **Request body:**
    - `clob_token_id`: Market identifier
    - `strategy`: Strategy configuration with `strategy_type` discriminator
    - `fee_rate`: Trading fee rate (default: 0.001 = 0.1%)
    - `limit`: Optional max trades to process

    **Returns:**
    - `statistics`: Performance metrics (PnL, win rate, drawdown, etc.)
    - `dataframe`: Detailed trade-by-trade data with equity curve
    """
    service = BacktestService()

    try:
        result = service.run_backtest(request)
        return result

    except StrategyNotFoundError as e:
        raise HTTPException(status_code=400, detail=str(e))

    except MarketNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))

    except InsufficientDataError as e:
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backtest failed: {str(e)}")

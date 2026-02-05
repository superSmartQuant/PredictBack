"""
Business logic service for running backtests.
"""

from app.config import settings
from app.core.backtester import Backtester, BacktestResult
from app.core.exceptions import (
    MarketNotFoundError,
    InsufficientDataError,
    TopicNotFoundError,
    TopicNotContinuousError,
)
from app.repository.polymarket import PolymarketRepository
from app.strategies.factory import create_strategy
from app.schemas.backtest import (
    BacktestRequest,
    BacktestResponse,
    BacktestStatisticsResponse,
    TradeRecord,
    GridStrategyConfig,
    MomentumStrategyConfig,
    CustomStrategyConfig,
)
from app.utils.data import format_trades
from app.utils.serialization import serialize_dataframe, decimal_to_str


class BacktestService:
    """Service for executing backtests."""

    def __init__(self):
        self.repository = PolymarketRepository(settings.database_url)

    def run_backtest(self, request: BacktestRequest) -> BacktestResponse:
        """
        Run a backtest with the given configuration.

        Two modes:
        1. Topic-based (continuous): Provide topic + amount_of_markets to backtest
           across multiple sequential markets in a continuous topic.
        2. Single-market: Provide clob_token_id to backtest a single market.

        Args:
            request: BacktestRequest with strategy config and market/topic identifier

        Returns:
            BacktestResponse with statistics and dataframe

        Raises:
            MarketNotFoundError: If market doesn't exist
            TopicNotFoundError: If topic doesn't exist
            TopicNotContinuousError: If topic is not continuous
            InsufficientDataError: If not enough trade data
        """
        # Topic-based continuous backtesting
        if request.topic:
            return self._run_topic_continuous_backtest(request)

        # clob_token_id-based backtesting
        if not self.repository.market_exists(request.clob_token_id):
            raise MarketNotFoundError(f"Market {request.clob_token_id} not found")

        # Standard single-market backtest
        trades = self.repository.get_trades(
            request.clob_token_id,
            limit=request.limit,
        )

        if not trades:
            raise InsufficientDataError(f"No trades found for market {request.clob_token_id}")

        df = format_trades(trades)

        # Create strategy instance
        strategy_config = self._build_strategy_config(request.strategy)
        strategy = create_strategy(strategy_config)

        # Run backtest
        backtester = Backtester(fee_rate=request.fee_rate)
        result = backtester.run(strategy, df)

        # Build response
        return self._build_response(result)

    def _run_topic_continuous_backtest(self, request: BacktestRequest) -> BacktestResponse:
        """
        Run a continuous multi-market backtest using topic name.

        Fetches all markets in the topic, sorts by timestamp,
        and runs the backtest across the most recent N markets.
        """
        # Validate topic exists and is continuous
        topic_info = self.repository.get_topic_info(request.topic)
        if not topic_info:
            raise TopicNotFoundError(f"Topic '{request.topic}' not found")

        if not topic_info.get("continuous"):
            raise TopicNotContinuousError(
                f"Topic '{request.topic}' is not a continuous market topic"
            )

        # Get continuous markets for the topic
        markets = self.repository.get_continuous_markets_by_topic(
            request.topic,
            amount=request.amount_of_markets,
        )

        if not markets:
            raise InsufficientDataError(
                f"No markets found for topic '{request.topic}'"
            )

        # Fetch trade data for each market
        market_data = []
        for market in markets:
            clob_id = market["clob_token_id"]
            if not self.repository.market_exists(clob_id):
                continue

            trades = self.repository.get_trades(clob_id, limit=request.limit)
            if trades:
                df = format_trades(trades)
                market_data.append((market.get("market_slug", clob_id), df))

        if not market_data:
            raise InsufficientDataError(
                f"No trade data found for any markets in topic '{request.topic}'"
            )

        # Create strategy instance
        strategy_config = self._build_strategy_config(request.strategy)
        strategy = create_strategy(strategy_config)

        # Run continuous backtest
        backtester = Backtester(fee_rate=request.fee_rate)
        result = backtester.run_continuous(strategy, market_data)

        # Build response
        return self._build_response(result)

    def _build_strategy_config(self, strategy: GridStrategyConfig | MomentumStrategyConfig | CustomStrategyConfig) -> dict:
        """Convert Pydantic strategy config to dict for factory."""
        return strategy.model_dump()

    def _build_response(self, result: BacktestResult) -> BacktestResponse:
        """Build API response from backtest result."""
        stats = result.statistics

        # Convert trades to response format
        trade_records = [
            TradeRecord(
                side=t.side,
                price=decimal_to_str(t.price),
                size=decimal_to_str(t.size),
                timestamp=t.timestamp.to_pydatetime(),
                pnl=decimal_to_str(t.pnl),
            )
            for t in stats.trades
        ]

        # Build statistics response
        statistics_response = BacktestStatisticsResponse(
            strategy_name=stats.strategy_name,
            initial_balance=decimal_to_str(stats.initial_balance),
            final_equity=decimal_to_str(stats.final_equity),
            total_pnl=decimal_to_str(stats.total_pnl),
            total_return_pct=stats.total_return_pct,
            total_trades=stats.total_trades,
            winning_trades=stats.winning_trades,
            losing_trades=stats.losing_trades,
            win_rate=stats.win_rate,
            max_drawdown=decimal_to_str(stats.max_drawdown),
            max_drawdown_pct=stats.max_drawdown_pct,
            sharpe_ratio=stats.sharpe_ratio,
            trades=trade_records,
        )

        # Serialize dataframe
        df_serialized = serialize_dataframe(result.dataframe)

        return BacktestResponse(
            success=True,
            statistics=statistics_response,
            dataframe=df_serialized,
            row_count=len(result.dataframe),
            columns=list(result.dataframe.columns),
        )

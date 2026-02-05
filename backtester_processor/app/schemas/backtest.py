"""
Pydantic models for backtest API request/response validation.
"""

from decimal import Decimal
from datetime import datetime
from typing import Literal, Optional, Union, Any, Annotated

from pydantic import BaseModel, Field, model_validator, field_validator


# Strategy Configuration Models
class GridStrategyConfig(BaseModel):
    """Configuration for Grid trading strategy."""
    strategy_type: Literal["grid"] = "grid"
    grid_size: int = Field(default=5, ge=1, le=20, description="Number of grid levels above and below")
    grid_spacing: Decimal = Field(default=Decimal("0.01"), gt=0, le=1, description="Price spacing between levels (0.01 = 1%)")
    order_size: Decimal = Field(default=Decimal("100"), gt=0, description="Size of each order")
    initial_balance: Decimal = Field(default=Decimal("10000"), gt=0, description="Starting balance")


class MomentumStrategyConfig(BaseModel):
    """Configuration for Momentum trading strategy."""
    strategy_type: Literal["momentum"] = "momentum"
    lookback_window: int = Field(default=10, ge=1, le=1000, description="Number of trades to look back")
    momentum_threshold: Decimal = Field(default=Decimal("0.005"), gt=0, le=1, description="Minimum momentum to trigger trade (0.005 = 0.5%)")
    order_size: Decimal = Field(default=Decimal("100"), gt=0, description="Size of each order")
    initial_balance: Decimal = Field(default=Decimal("10000"), gt=0, description="Starting balance")


# Custom Strategy Configuration Models
class IndicatorConfig(BaseModel):
    """Configuration for a technical indicator."""
    type: Literal["sma", "ema", "rsi", "macd", "bollinger"]
    name: str = Field(..., min_length=1, description="Unique name for this indicator")
    period: Optional[int] = Field(default=None, ge=1, description="Period for SMA/EMA/RSI/Bollinger")
    # MACD specific
    fast_period: Optional[int] = Field(default=None, ge=1, description="MACD fast period")
    slow_period: Optional[int] = Field(default=None, ge=1, description="MACD slow period")
    signal_period: Optional[int] = Field(default=None, ge=1, description="MACD signal period")
    # Bollinger specific
    num_std: Optional[float] = Field(default=None, gt=0, description="Bollinger bands standard deviations")


class RuleCondition(BaseModel):
    """A single condition in a trading rule."""
    indicator: str = Field(..., description="Indicator name or 'price'")
    operator: Literal[">", "<", ">=", "<=", "cross_above", "cross_below"]
    value: Optional[float] = Field(default=None, description="Value to compare against")
    compare_to_indicator: Optional[str] = Field(default=None, description="Indicator to compare against")


class TradingRule(BaseModel):
    """A trading rule with one or more conditions (AND logic within rule)."""
    conditions: Optional[list[RuleCondition]] = Field(default=None, description="Multiple conditions with AND logic")
    # Single condition shorthand (will be converted to conditions list)
    indicator: Optional[str] = None
    operator: Optional[Literal[">", "<", ">=", "<=", "cross_above", "cross_below"]] = None
    value: Optional[float] = None
    compare_to_indicator: Optional[str] = None
    description: Optional[str] = Field(default=None, description="Human-readable rule description")


class CustomStrategyConfig(BaseModel):
    """Configuration for Custom indicator-based strategy."""
    strategy_type: Literal["custom"] = "custom"
    indicators: list[IndicatorConfig] = Field(..., min_length=1, description="List of indicators to use")
    buy_rules: list[TradingRule] = Field(default_factory=list, description="Rules for buy signals (OR logic)")
    sell_rules: list[TradingRule] = Field(default_factory=list, description="Rules for sell signals (OR logic)")
    order_size: Decimal = Field(default=Decimal("100"), gt=0, description="Size of each order")
    initial_balance: Decimal = Field(default=Decimal("10000"), gt=0, description="Starting balance")

    @field_validator("order_size", mode="before")
    @classmethod
    def order_size_default(cls, v):
        """Use default for empty strings."""
        if v == "" or v is None:
            return Decimal("100")
        return v

    @field_validator("initial_balance", mode="before")
    @classmethod
    def initial_balance_default(cls, v):
        """Use default for empty strings."""
        if v == "" or v is None:
            return Decimal("10000")
        return v


StrategyConfig = Annotated[
    Union[GridStrategyConfig, MomentumStrategyConfig, CustomStrategyConfig],
    Field(discriminator="strategy_type")
]


# Request Model
class BacktestRequest(BaseModel):
    """
    Request model for running a backtest.

    For single-market backtest: provide clob_token_id
    For continuous market backtest: provide topic + amount_of_markets
    """
    clob_token_id: Optional[str] = Field(
        default=None,
        min_length=1,
        description="Market identifier (clob token ID). Required for single-market backtests."
    )
    topic: Optional[str] = Field(
        default=None,
        min_length=1,
        description="Topic name for continuous market backtesting. "
                    "When provided with amount_of_markets, backtests across multiple sequential markets."
    )
    strategy: StrategyConfig = Field(..., description="Strategy configuration")
    fee_rate: Decimal = Field(default=Decimal("0.001"), ge=0, le=1, description="Trading fee rate (0.001 = 0.1%)")
    limit: Optional[int] = Field(default=None, ge=1, description="Maximum number of trades to process")
    amount_of_markets: Optional[int] = Field(
        default=None,
        ge=1,
        description="For continuous markets: number of sequential markets to backtest. "
                    "Required when using topic-based continuous backtesting."
    )

    @model_validator(mode="after")
    def validate_market_identifier(self):
        """Ensure either clob_token_id or topic is provided."""
        if not self.clob_token_id and not self.topic:
            raise ValueError("Either clob_token_id or topic must be provided")
        if self.topic and not self.amount_of_markets:
            raise ValueError("amount_of_markets is required when using topic-based continuous backtesting")
        return self


# Response Models
class TradeRecord(BaseModel):
    """Record of an executed trade."""
    side: str
    price: str
    size: str
    timestamp: datetime
    pnl: str


class BacktestStatisticsResponse(BaseModel):
    """Backtest statistics response."""
    strategy_name: str
    initial_balance: str
    final_equity: str
    total_pnl: str
    total_return_pct: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    max_drawdown: str
    max_drawdown_pct: float
    sharpe_ratio: Optional[float]
    trades: list[TradeRecord]


class BacktestResponse(BaseModel):
    """Response model for backtest results."""
    success: bool
    statistics: BacktestStatisticsResponse
    dataframe: list[dict[str, Any]]
    row_count: int
    columns: list[str]


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str


class ErrorResponse(BaseModel):
    """Error response model."""
    detail: str
    error_code: Optional[str] = None


# Topic Models
class Topic(BaseModel):
    """Topic/category model."""
    id: int
    name: str
    continuous: bool
    created_at: datetime


class TopicsResponse(BaseModel):
    """Response model for topics list."""
    topics: list[Topic]
    count: int


class MarketInfo(BaseModel):
    """Market information."""
    clob_token_id: str
    market_slug: Optional[str]
    question: Optional[str]
    neg: bool
    topic: Optional[str]


class MarketsResponse(BaseModel):
    """Response model for markets list."""
    markets: list[MarketInfo]
    count: int

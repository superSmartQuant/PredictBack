"""
Strategy factory for creating strategy instances from configuration.
"""

from decimal import Decimal
from typing import Union

from app.core.strategy import Strategy
from app.core.exceptions import StrategyNotFoundError
from app.strategies.grid_strategy import GridStrategy
from app.strategies.momentum_strategy import MomentumStrategy
from app.strategies.custom_strategy import CustomStrategy


def _to_decimal(value, default: str) -> Decimal:
    """Convert value to Decimal, using default for empty/None values."""
    if value is None or value == "":
        return Decimal(default)
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


def create_strategy(config: dict) -> Strategy:
    """
    Create a strategy instance from configuration.

    Args:
        config: Strategy configuration with strategy_type and parameters

    Returns:
        Strategy instance

    Raises:
        StrategyNotFoundError: If strategy type is not recognized
    """
    strategy_type = config.get("strategy_type")

    if strategy_type == "grid":
        return GridStrategy(
            grid_size=config.get("grid_size", 5),
            grid_spacing=config.get("grid_spacing"),
            order_size=config.get("order_size"),
            initial_balance=config.get("initial_balance"),
        )
    elif strategy_type == "momentum":
        return MomentumStrategy(
            lookback_window=config.get("lookback_window", 10),
            momentum_threshold=config.get("momentum_threshold"),
            order_size=config.get("order_size"),
            initial_balance=config.get("initial_balance"),
        )
    elif strategy_type == "custom":
        return CustomStrategy(
            indicators_config=config.get("indicators", []),
            buy_rules=config.get("buy_rules", []),
            sell_rules=config.get("sell_rules", []),
            order_size=_to_decimal(config.get("order_size"), "100"),
            initial_balance=_to_decimal(config.get("initial_balance"), "10000"),
        )
    else:
        raise StrategyNotFoundError(f"Unknown strategy type: {strategy_type}")

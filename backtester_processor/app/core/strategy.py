"""
Base strategy class for backtesting.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Optional
import pandas as pd


@dataclass
class Position:
    """Represents a trading position."""
    side: str  # "long" or "short"
    entry_price: Decimal
    size: Decimal
    entry_time: pd.Timestamp
    entry_fee: Decimal = Decimal("0")


@dataclass
class Order:
    """Represents a trade order."""
    side: str  # "buy" or "sell"
    price: Decimal
    size: Decimal
    order_type: str = "limit"  # "limit" or "market"


@dataclass
class Trade:
    """Represents an executed trade."""
    side: str
    price: Decimal
    size: Decimal
    timestamp: pd.Timestamp
    pnl: Decimal = Decimal("0")


@dataclass
class StrategyState:
    """Holds the current state of a strategy."""
    balance: Decimal = Decimal("10000")
    position: Optional[Position] = None
    trades: list[Trade] = field(default_factory=list)

    @property
    def is_flat(self) -> bool:
        """Check if no position is held."""
        return self.position is None


class Strategy(ABC):
    """
    Abstract base class for trading strategies.

    Strategies receive market data one row at a time (no future data)
    and return orders to execute.
    """

    def __init__(self, initial_balance: Decimal = Decimal("10000")):
        self.state = StrategyState(balance=initial_balance)
        self.initial_balance = initial_balance

    @abstractmethod
    def on_trade(self, trade_data: pd.Series, historical_data: pd.DataFrame) -> list[Order]:
        """
        Called for each trade in the backtest.

        Args:
            trade_data: Current trade row (price, side, size, timestamp, etc.)
            historical_data: All trades UP TO AND INCLUDING current trade (no future data)

        Returns:
            List of orders to execute
        """
        pass

    def on_start(self) -> None:
        """Called before backtest starts. Override for initialization."""
        pass

    def on_end(self) -> None:
        """Called after backtest ends. Override for cleanup."""
        pass

    def reset(self) -> None:
        """Reset strategy state for a new backtest run."""
        self.state = StrategyState(balance=self.initial_balance)
        self.on_start()

    @property
    def pnl(self) -> Decimal:
        """Total realized PnL."""
        return sum(t.pnl for t in self.state.trades)

    @property
    def total_trades(self) -> int:
        """Total number of executed trades."""
        return len(self.state.trades)

    @property
    def win_rate(self) -> float:
        """Percentage of winning trades."""
        if not self.state.trades:
            return 0.0
        wins = sum(1 for t in self.state.trades if t.pnl > 0)
        return wins / len(self.state.trades)

"""
Base indicator class with proper handling for stateful/continuous indicators.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Optional, Any


@dataclass
class IndicatorConfig:
    """Configuration metadata for an indicator."""
    name: str
    params: dict[str, Any]
    warmup_period: int  # Minimum data points before output is reliable
    is_stateful: bool  # True for continuous indicators (EMA), False for window-based (SMA)


class Indicator(ABC):
    """
    Abstract base class for all indicators.

    Two types of indicators:
    1. Stateless/Window-based (e.g., SMA): Can be calculated from a fixed window of data.
       Safe to use immediately after warmup period.

    2. Stateful/Continuous (e.g., EMA): Maintains internal state that evolves over time.
       REQUIRES CAREFUL HANDLING:
       - Must call reset() before each backtest run
       - Output unreliable until warmup_period samples processed
       - State depends on entire history, not just recent window
    """

    def __init__(self):
        self._samples_processed: int = 0
        self._current_value: Optional[Decimal] = None

    @property
    @abstractmethod
    def config(self) -> IndicatorConfig:
        """Return indicator configuration."""
        pass

    @property
    def name(self) -> str:
        return self.config.name

    @property
    def warmup_period(self) -> int:
        return self.config.warmup_period

    @property
    def is_stateful(self) -> bool:
        return self.config.is_stateful

    @property
    def is_ready(self) -> bool:
        """True if enough data has been processed for reliable output."""
        return self._samples_processed >= self.warmup_period

    @property
    def value(self) -> Optional[Decimal]:
        """Current indicator value. None if not ready."""
        if not self.is_ready:
            return None
        return self._current_value

    @abstractmethod
    def update(self, price: Decimal) -> Optional[Decimal]:
        """
        Process a new price and return the updated indicator value.

        Args:
            price: New price to process

        Returns:
            Current indicator value, or None if still in warmup period
        """
        pass

    def reset(self) -> None:
        """
        Reset indicator state. MUST be called before each backtest run
        for stateful indicators.
        """
        self._samples_processed = 0
        self._current_value = None
        self._reset_state()

    @abstractmethod
    def _reset_state(self) -> None:
        """Reset any indicator-specific internal state."""
        pass

    def __repr__(self) -> str:
        params_str = ", ".join(f"{k}={v}" for k, v in self.config.params.items())
        ready_str = "ready" if self.is_ready else f"warmup {self._samples_processed}/{self.warmup_period}"
        return f"{self.name}({params_str}) [{ready_str}]"

"""
Simple Moving Average indicator.
"""

from collections import deque
from decimal import Decimal
from typing import Optional

from app.indicators.base import Indicator, IndicatorConfig


class SMA(Indicator):
    """
    Simple Moving Average.

    Stateless - calculated purely from the last N prices.
    Safe to use as soon as warmup period is reached.
    """

    def __init__(self, period: int = 20):
        super().__init__()
        if period < 1:
            raise ValueError("Period must be >= 1")
        self.period = period
        self._window: deque[Decimal] = deque(maxlen=period)

    @property
    def config(self) -> IndicatorConfig:
        return IndicatorConfig(
            name="SMA",
            params={"period": self.period},
            warmup_period=self.period,
            is_stateful=False,
        )

    def update(self, price: Decimal) -> Optional[Decimal]:
        self._window.append(price)
        self._samples_processed += 1

        if not self.is_ready:
            return None

        self._current_value = sum(self._window) / Decimal(len(self._window))
        return self._current_value

    def _reset_state(self) -> None:
        self._window.clear()

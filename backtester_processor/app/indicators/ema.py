"""
Exponential Moving Average indicator.
"""

from decimal import Decimal
from typing import Optional

from app.indicators.base import Indicator, IndicatorConfig


class EMA(Indicator):
    """
    Exponential Moving Average.

    STATEFUL/CONTINUOUS - the current value depends on ALL previous prices,
    not just a fixed window. This has important implications:

    1. WARMUP: The first `period` values are unreliable. We initialize
       with SMA of first `period` prices, then apply EMA formula.

    2. RESET: You MUST call reset() before each backtest run, otherwise
       state from previous runs will corrupt results.

    3. HISTORY DEPENDENCE: Unlike SMA, you can't just "jump in" at any point.
       The EMA value depends on the entire price history.
    """

    def __init__(self, period: int = 20):
        super().__init__()
        if period < 1:
            raise ValueError("Period must be >= 1")
        self.period = period
        self._multiplier = Decimal(2) / Decimal(period + 1)
        self._warmup_prices: list[Decimal] = []

    @property
    def config(self) -> IndicatorConfig:
        return IndicatorConfig(
            name="EMA",
            params={"period": self.period},
            warmup_period=self.period,
            is_stateful=True,  # IMPORTANT: This is a continuous indicator
        )

    def update(self, price: Decimal) -> Optional[Decimal]:
        self._samples_processed += 1

        # During warmup: collect prices for initial SMA
        if self._current_value is None:
            self._warmup_prices.append(price)
            if len(self._warmup_prices) >= self.period:
                # Initialize EMA with SMA of first `period` prices
                self._current_value = sum(self._warmup_prices) / Decimal(self.period)
            return self._current_value

        # After warmup: apply EMA formula
        # EMA = price * multiplier + previous_EMA * (1 - multiplier)
        self._current_value = (
            price * self._multiplier +
            self._current_value * (Decimal(1) - self._multiplier)
        )
        return self._current_value

    def _reset_state(self) -> None:
        self._warmup_prices = []

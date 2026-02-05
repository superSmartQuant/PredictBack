"""
MACD (Moving Average Convergence Divergence) indicator.
"""

from decimal import Decimal
from typing import Optional

from app.indicators.base import Indicator, IndicatorConfig
from app.indicators.ema import EMA


class MACD(Indicator):
    """
    Moving Average Convergence Divergence.

    STATEFUL - composed of three EMAs, inherits their statefulness.

    Components:
    - MACD Line: fast_EMA - slow_EMA
    - Signal Line: EMA of MACD Line
    - Histogram: MACD Line - Signal Line

    Standard parameters: fast=12, slow=26, signal=9

    Trading signals:
    - MACD crosses above signal: Bullish
    - MACD crosses below signal: Bearish
    - Histogram shows momentum strength
    """

    def __init__(
        self,
        fast_period: int = 12,
        slow_period: int = 26,
        signal_period: int = 9,
    ):
        super().__init__()
        if fast_period >= slow_period:
            raise ValueError("fast_period must be < slow_period")
        if signal_period < 1:
            raise ValueError("signal_period must be >= 1")

        self.fast_period = fast_period
        self.slow_period = slow_period
        self.signal_period = signal_period

        self._fast_ema = EMA(fast_period)
        self._slow_ema = EMA(slow_period)
        self._signal_ema = EMA(signal_period)

        # Additional outputs
        self._signal_value: Optional[Decimal] = None
        self._histogram: Optional[Decimal] = None

    @property
    def config(self) -> IndicatorConfig:
        return IndicatorConfig(
            name="MACD",
            params={
                "fast": self.fast_period,
                "slow": self.slow_period,
                "signal": self.signal_period,
            },
            # Need slow_period for MACD line, then signal_period more for signal line
            warmup_period=self.slow_period + self.signal_period,
            is_stateful=True,
        )

    @property
    def signal(self) -> Optional[Decimal]:
        """Signal line value."""
        return self._signal_value

    @property
    def histogram(self) -> Optional[Decimal]:
        """MACD histogram (MACD - Signal)."""
        return self._histogram

    def update(self, price: Decimal) -> Optional[Decimal]:
        self._samples_processed += 1

        fast = self._fast_ema.update(price)
        slow = self._slow_ema.update(price)

        # Need both EMAs ready for MACD line
        if fast is None or slow is None:
            return None

        macd_line = fast - slow
        self._current_value = macd_line

        # Update signal line
        signal = self._signal_ema.update(macd_line)
        if signal is not None:
            self._signal_value = signal
            self._histogram = macd_line - signal

        return self._current_value

    def _reset_state(self) -> None:
        self._fast_ema.reset()
        self._slow_ema.reset()
        self._signal_ema.reset()
        self._signal_value = None
        self._histogram = None

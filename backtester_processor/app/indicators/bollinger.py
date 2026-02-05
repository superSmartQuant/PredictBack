"""
Bollinger Bands indicator.
"""

from collections import deque
from decimal import Decimal
from typing import Optional
import math

from app.indicators.base import Indicator, IndicatorConfig


class BollingerBands(Indicator):
    """
    Bollinger Bands.

    Stateless - based on SMA and standard deviation of a fixed window.

    Components:
    - Middle Band: SMA of price
    - Upper Band: SMA + (std_dev * num_std)
    - Lower Band: SMA - (std_dev * num_std)

    Standard parameters: period=20, num_std=2

    Trading signals:
    - Price near upper band: Potentially overbought
    - Price near lower band: Potentially oversold
    - Band squeeze (narrow bands): Low volatility, potential breakout
    - Band expansion: High volatility
    """

    def __init__(self, period: int = 20, num_std: Decimal = Decimal("2")):
        super().__init__()
        if period < 2:
            raise ValueError("Period must be >= 2 for standard deviation")
        self.period = period
        self.num_std = num_std
        self._window: deque[Decimal] = deque(maxlen=period)

        # Additional outputs
        self._upper: Optional[Decimal] = None
        self._lower: Optional[Decimal] = None
        self._bandwidth: Optional[Decimal] = None

    @property
    def config(self) -> IndicatorConfig:
        return IndicatorConfig(
            name="BollingerBands",
            params={"period": self.period, "num_std": float(self.num_std)},
            warmup_period=self.period,
            is_stateful=False,
        )

    @property
    def upper(self) -> Optional[Decimal]:
        """Upper band value."""
        return self._upper

    @property
    def lower(self) -> Optional[Decimal]:
        """Lower band value."""
        return self._lower

    @property
    def middle(self) -> Optional[Decimal]:
        """Middle band (SMA) value."""
        return self._current_value

    @property
    def bandwidth(self) -> Optional[Decimal]:
        """Bandwidth: (upper - lower) / middle. Measures volatility."""
        return self._bandwidth

    def update(self, price: Decimal) -> Optional[Decimal]:
        self._window.append(price)
        self._samples_processed += 1

        if not self.is_ready:
            return None

        # Calculate SMA (middle band)
        sma = sum(self._window) / Decimal(self.period)
        self._current_value = sma

        # Calculate standard deviation
        variance = sum((p - sma) ** 2 for p in self._window) / Decimal(self.period)
        std_dev = Decimal(str(math.sqrt(float(variance))))

        # Calculate bands
        self._upper = sma + (std_dev * self.num_std)
        self._lower = sma - (std_dev * self.num_std)

        # Bandwidth
        if sma != Decimal(0):
            self._bandwidth = (self._upper - self._lower) / sma

        return self._current_value

    def _reset_state(self) -> None:
        self._window.clear()
        self._upper = None
        self._lower = None
        self._bandwidth = None

"""
Relative Strength Index indicator.
"""

from decimal import Decimal
from typing import Optional

from app.indicators.base import Indicator, IndicatorConfig


class RSI(Indicator):
    """
    Relative Strength Index.

    STATEFUL - uses exponential smoothing for average gains/losses.

    RSI = 100 - (100 / (1 + RS))
    RS = Average Gain / Average Loss

    Standard period is 14. RSI oscillates between 0 and 100.
    - RSI > 70: Overbought
    - RSI < 30: Oversold
    """

    def __init__(self, period: int = 14):
        super().__init__()
        if period < 1:
            raise ValueError("Period must be >= 1")
        self.period = period
        self._prev_price: Optional[Decimal] = None
        self._avg_gain: Optional[Decimal] = None
        self._avg_loss: Optional[Decimal] = None
        self._gains: list[Decimal] = []
        self._losses: list[Decimal] = []

    @property
    def config(self) -> IndicatorConfig:
        return IndicatorConfig(
            name="RSI",
            params={"period": self.period},
            warmup_period=self.period + 1,  # Need period+1 prices to get period changes
            is_stateful=True,
        )

    def update(self, price: Decimal) -> Optional[Decimal]:
        self._samples_processed += 1

        if self._prev_price is None:
            self._prev_price = price
            return None

        # Calculate price change
        change = price - self._prev_price
        self._prev_price = price

        gain = change if change > 0 else Decimal(0)
        loss = -change if change < 0 else Decimal(0)

        # During warmup: collect gains/losses
        if self._avg_gain is None:
            self._gains.append(gain)
            self._losses.append(loss)

            if len(self._gains) >= self.period:
                # Initialize with simple average
                self._avg_gain = sum(self._gains) / Decimal(self.period)
                self._avg_loss = sum(self._losses) / Decimal(self.period)
                self._current_value = self._calculate_rsi()
            return self._current_value

        # After warmup: use smoothed averages (Wilder's smoothing)
        self._avg_gain = (self._avg_gain * Decimal(self.period - 1) + gain) / Decimal(self.period)
        self._avg_loss = (self._avg_loss * Decimal(self.period - 1) + loss) / Decimal(self.period)

        self._current_value = self._calculate_rsi()
        return self._current_value

    def _calculate_rsi(self) -> Decimal:
        if self._avg_loss == Decimal(0):
            return Decimal(100)  # No losses = max RSI

        rs = self._avg_gain / self._avg_loss
        return Decimal(100) - (Decimal(100) / (Decimal(1) + rs))

    def _reset_state(self) -> None:
        self._prev_price = None
        self._avg_gain = None
        self._avg_loss = None
        self._gains = []
        self._losses = []

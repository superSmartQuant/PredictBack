"""
Technical indicators for trading strategies.

IMPORTANT: Stateful vs Stateless Indicators
-------------------------------------------

Stateless (window-based):
- SMA, BollingerBands
- Calculated from a fixed window of recent prices
- Safe to use as soon as warmup period is reached

Stateful (continuous):
- EMA, RSI, MACD
- Internal state depends on ENTIRE price history
- MUST call reset() before each backtest run
- Output unreliable until warmup_period samples processed

Recommended Usage (via IndicatorManager):
-----------------------------------------
    from app.indicators import IndicatorManager, EMA, RSI

    manager = IndicatorManager()
    manager.add("ema", EMA(20))
    manager.add("rsi", RSI(14))
    manager.reset()  # REQUIRED

    for price in prices:
        snapshot = manager.update(price)
        if snapshot.all_ready:
            ema_val = snapshot.get("ema")
            rsi_val = snapshot.get("rsi")
"""

from app.indicators.base import Indicator, IndicatorConfig
from app.indicators.sma import SMA
from app.indicators.ema import EMA
from app.indicators.rsi import RSI
from app.indicators.macd import MACD
from app.indicators.bollinger import BollingerBands
from app.indicators.manager import (
    IndicatorManager,
    IndicatorSnapshot,
    ManagerState,
    IndicatorError,
    IndicatorNotReadyError,
    ManagerNotResetError,
    DuplicateIndicatorError,
    IndicatorNotFoundError,
)

__all__ = [
    # Base
    "Indicator",
    "IndicatorConfig",
    # Indicators
    "SMA",
    "EMA",
    "RSI",
    "MACD",
    "BollingerBands",
    # Manager
    "IndicatorManager",
    "IndicatorSnapshot",
    "ManagerState",
    # Exceptions
    "IndicatorError",
    "IndicatorNotReadyError",
    "ManagerNotResetError",
    "DuplicateIndicatorError",
    "IndicatorNotFoundError",
]

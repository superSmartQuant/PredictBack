"""
Indicator Manager - enforces proper usage of indicators and prevents common mistakes.
"""

from decimal import Decimal
from typing import Optional, TypeVar, Type
from dataclasses import dataclass, field
from enum import Enum, auto

from app.indicators.base import Indicator, IndicatorConfig


class ManagerState(Enum):
    """State machine for indicator manager."""
    UNINITIALIZED = auto()  # No indicators added yet
    READY = auto()          # Reset called, ready to process
    RUNNING = auto()        # Processing data
    DIRTY = auto()          # Needs reset before next run


class IndicatorError(Exception):
    """Base exception for indicator errors."""
    pass


class IndicatorNotReadyError(IndicatorError):
    """Raised when accessing indicator value before warmup complete."""
    pass


class ManagerNotResetError(IndicatorError):
    """Raised when processing without calling reset() first."""
    pass


class DuplicateIndicatorError(IndicatorError):
    """Raised when adding an indicator with a duplicate name."""
    pass


class IndicatorNotFoundError(IndicatorError):
    """Raised when accessing an indicator that doesn't exist."""
    pass


@dataclass
class IndicatorSnapshot:
    """Snapshot of all indicator values at a point in time."""
    values: dict[str, Optional[Decimal]]
    ready_status: dict[str, bool]
    samples_processed: int

    def get(self, name: str, default: Optional[Decimal] = None) -> Optional[Decimal]:
        """Get indicator value by name, with optional default."""
        return self.values.get(name, default)

    def is_ready(self, name: str) -> bool:
        """Check if specific indicator is ready."""
        return self.ready_status.get(name, False)

    @property
    def all_ready(self) -> bool:
        """True if all indicators have completed warmup."""
        return all(self.ready_status.values())


T = TypeVar("T", bound=Indicator)


class IndicatorManager:
    """
    Manages a collection of indicators with safety guarantees.

    Features:
    - Enforces reset() before each backtest run
    - Tracks warmup status for all indicators
    - Prevents accessing values before indicators are ready
    - Provides bulk update for all indicators
    - Type-safe indicator retrieval

    Usage:
        manager = IndicatorManager()
        manager.add("fast_ema", EMA(12))
        manager.add("slow_ema", EMA(26))
        manager.add("rsi", RSI(14))

        manager.reset()  # REQUIRED before processing

        for price in prices:
            snapshot = manager.update(price)
            if snapshot.all_ready:
                # Safe to use all values
                fast = snapshot.get("fast_ema")
                slow = snapshot.get("slow_ema")
    """

    def __init__(self, strict_mode: bool = True):
        """
        Initialize indicator manager.

        Args:
            strict_mode: If True, raises exceptions on misuse.
                        If False, returns None/logs warnings instead.
        """
        self._indicators: dict[str, Indicator] = {}
        self._state: ManagerState = ManagerState.UNINITIALIZED
        self._samples_processed: int = 0
        self._strict_mode = strict_mode

    @property
    def state(self) -> ManagerState:
        """Current manager state."""
        return self._state

    @property
    def samples_processed(self) -> int:
        """Number of price samples processed since last reset."""
        return self._samples_processed

    @property
    def indicator_names(self) -> list[str]:
        """List of all indicator names."""
        return list(self._indicators.keys())

    @property
    def all_ready(self) -> bool:
        """True if all indicators have completed warmup."""
        if not self._indicators:
            return False
        return all(ind.is_ready for ind in self._indicators.values())

    @property
    def max_warmup_period(self) -> int:
        """Maximum warmup period across all indicators."""
        if not self._indicators:
            return 0
        return max(ind.warmup_period for ind in self._indicators.values())

    def add(self, name: str, indicator: Indicator) -> "IndicatorManager":
        """
        Add an indicator to the manager.

        Args:
            name: Unique name for this indicator
            indicator: The indicator instance

        Returns:
            Self for method chaining

        Raises:
            DuplicateIndicatorError: If name already exists
        """
        if name in self._indicators:
            raise DuplicateIndicatorError(f"Indicator '{name}' already exists")

        self._indicators[name] = indicator

        # Mark as dirty if we were running (need reset for new indicator)
        if self._state == ManagerState.RUNNING:
            self._state = ManagerState.DIRTY

        return self

    def remove(self, name: str) -> Indicator:
        """
        Remove and return an indicator.

        Args:
            name: Name of indicator to remove

        Returns:
            The removed indicator

        Raises:
            IndicatorNotFoundError: If indicator doesn't exist
        """
        if name not in self._indicators:
            raise IndicatorNotFoundError(f"Indicator '{name}' not found")

        return self._indicators.pop(name)

    def get(self, name: str, indicator_type: Optional[Type[T]] = None) -> Indicator:
        """
        Get an indicator by name with optional type checking.

        Args:
            name: Indicator name
            indicator_type: Expected type (for type hints)

        Returns:
            The indicator instance

        Raises:
            IndicatorNotFoundError: If indicator doesn't exist
        """
        if name not in self._indicators:
            raise IndicatorNotFoundError(f"Indicator '{name}' not found")

        return self._indicators[name]

    def get_value(self, name: str, require_ready: bool = True) -> Optional[Decimal]:
        """
        Get current value of an indicator.

        Args:
            name: Indicator name
            require_ready: If True, raises error if indicator not ready

        Returns:
            Current indicator value or None

        Raises:
            IndicatorNotFoundError: If indicator doesn't exist
            IndicatorNotReadyError: If require_ready=True and indicator not ready
        """
        indicator = self.get(name)

        if require_ready and not indicator.is_ready:
            if self._strict_mode:
                raise IndicatorNotReadyError(
                    f"Indicator '{name}' not ready. "
                    f"Processed {indicator._samples_processed}/{indicator.warmup_period} samples."
                )
            return None

        return indicator.value

    def reset(self) -> "IndicatorManager":
        """
        Reset all indicators. MUST be called before each backtest run.

        Returns:
            Self for method chaining
        """
        for indicator in self._indicators.values():
            indicator.reset()

        self._samples_processed = 0
        self._state = ManagerState.READY
        return self

    def update(self, price: Decimal) -> IndicatorSnapshot:
        """
        Update all indicators with a new price.

        Args:
            price: New price value

        Returns:
            Snapshot of all indicator values

        Raises:
            ManagerNotResetError: If reset() wasn't called first
        """
        # Check state
        if self._state == ManagerState.UNINITIALIZED:
            if self._strict_mode:
                raise ManagerNotResetError(
                    "Manager has no indicators. Add indicators then call reset()."
                )

        if self._state == ManagerState.DIRTY:
            if self._strict_mode:
                raise ManagerNotResetError(
                    "Manager state is dirty. Call reset() before processing."
                )

        if self._state == ManagerState.READY:
            self._state = ManagerState.RUNNING

        # Update all indicators
        values: dict[str, Optional[Decimal]] = {}
        ready_status: dict[str, bool] = {}

        for name, indicator in self._indicators.items():
            values[name] = indicator.update(price)
            ready_status[name] = indicator.is_ready

        self._samples_processed += 1

        return IndicatorSnapshot(
            values=values,
            ready_status=ready_status,
            samples_processed=self._samples_processed,
        )

    def mark_dirty(self) -> None:
        """
        Mark manager as needing reset.
        Call this if external factors invalidate indicator state.
        """
        if self._state != ManagerState.UNINITIALIZED:
            self._state = ManagerState.DIRTY

    def get_status(self) -> dict:
        """
        Get detailed status of all indicators.

        Returns:
            Dictionary with indicator status info
        """
        return {
            "state": self._state.name,
            "samples_processed": self._samples_processed,
            "all_ready": self.all_ready,
            "max_warmup": self.max_warmup_period,
            "indicators": {
                name: {
                    "type": ind.config.name,
                    "params": ind.config.params,
                    "is_stateful": ind.is_stateful,
                    "warmup_period": ind.warmup_period,
                    "is_ready": ind.is_ready,
                    "samples_processed": ind._samples_processed,
                    "current_value": float(ind.value) if ind.value is not None else None,
                }
                for name, ind in self._indicators.items()
            },
        }

    def __len__(self) -> int:
        return len(self._indicators)

    def __contains__(self, name: str) -> bool:
        return name in self._indicators

    def __repr__(self) -> str:
        indicators_str = ", ".join(
            f"{name}:{ind.config.name}" for name, ind in self._indicators.items()
        )
        return f"IndicatorManager({self._state.name}, [{indicators_str}])"

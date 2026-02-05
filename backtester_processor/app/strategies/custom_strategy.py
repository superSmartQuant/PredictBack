"""
Custom strategy with user-configurable indicators.

This strategy allows users to combine indicators (EMA, RSI, MACD, etc.)
and define simple trading rules without writing code.
"""

from decimal import Decimal
from typing import Optional
from dataclasses import dataclass
from enum import Enum
import pandas as pd

from app.core.strategy import Strategy, Order
from app.indicators import (
    IndicatorManager,
    SMA,
    EMA,
    RSI,
    MACD,
    BollingerBands,
)


class ConditionOperator(str, Enum):
    """Comparison operators for conditions."""
    GT = ">"       # greater than
    LT = "<"       # less than
    GTE = ">="     # greater than or equal
    LTE = "<="     # less than or equal
    CROSS_ABOVE = "cross_above"  # value crosses above threshold
    CROSS_BELOW = "cross_below"  # value crosses below threshold


@dataclass
class IndicatorCondition:
    """
    A single condition that must be met for a signal.

    Examples:
        - RSI < 30 (oversold)
        - fast_ema > slow_ema (uptrend)
        - price cross_above upper_bb (breakout)
    """
    indicator_name: str  # Name of indicator (or "price")
    operator: ConditionOperator
    # Can compare to a fixed value OR another indicator
    compare_to_value: Optional[Decimal] = None
    compare_to_indicator: Optional[str] = None

    def __post_init__(self):
        if self.compare_to_value is None and self.compare_to_indicator is None:
            raise ValueError("Must specify either compare_to_value or compare_to_indicator")


@dataclass
class SignalRule:
    """
    A trading signal rule combining multiple conditions.

    All conditions must be met (AND logic) for the signal to trigger.
    """
    signal_type: str  # "buy" or "sell"
    conditions: list[IndicatorCondition]
    description: str = ""


class CustomStrategy(Strategy):
    """
    User-configurable strategy using the indicator system.

    Users can:
    1. Add any combination of indicators with custom parameters
    2. Define buy/sell rules based on indicator conditions
    3. Set risk parameters (order size, etc.)

    Example config:
        {
            "strategy_type": "custom",
            "indicators": [
                {"type": "ema", "name": "fast_ema", "period": 12},
                {"type": "ema", "name": "slow_ema", "period": 26},
                {"type": "rsi", "name": "rsi", "period": 14}
            ],
            "buy_rules": [
                {"indicator": "fast_ema", "operator": ">", "compare_to_indicator": "slow_ema"},
                {"indicator": "rsi", "operator": "<", "value": 70}
            ],
            "sell_rules": [
                {"indicator": "fast_ema", "operator": "<", "compare_to_indicator": "slow_ema"},
                {"indicator": "rsi", "operator": ">", "value": 30}
            ],
            "order_size": "100",
            "initial_balance": "10000"
        }
    """

    # Supported indicator types
    INDICATOR_TYPES = {
        "sma": SMA,
        "ema": EMA,
        "rsi": RSI,
        "macd": MACD,
        "bollinger": BollingerBands,
    }

    def __init__(
        self,
        indicators_config: list[dict],
        buy_rules: list[dict],
        sell_rules: list[dict],
        order_size: Decimal = Decimal("100"),
        initial_balance: Decimal = Decimal("10000"),
    ):
        """
        Initialize custom strategy.

        Args:
            indicators_config: List of indicator configurations
            buy_rules: List of conditions for buy signals
            sell_rules: List of conditions for sell signals
            order_size: Size of each order
            initial_balance: Starting balance
        """
        super().__init__(initial_balance)
        self.order_size = order_size

        # Initialize indicator manager
        self.manager = IndicatorManager(strict_mode=True)

        # Parse and add indicators
        self._setup_indicators(indicators_config)

        # Parse trading rules
        self.buy_rules = self._parse_rules(buy_rules, "buy")
        self.sell_rules = self._parse_rules(sell_rules, "sell")

        # Track previous values for crossover detection
        self._prev_values: dict[str, Optional[Decimal]] = {}

    # Parameters accepted by each indicator type
    INDICATOR_PARAMS = {
        "sma": {"period"},
        "ema": {"period"},
        "rsi": {"period"},
        "macd": {"fast_period", "slow_period", "signal_period"},
        "bollinger": {"period", "num_std"},
    }

    def _setup_indicators(self, configs: list[dict]) -> None:
        """Set up indicators from configuration."""
        for config in configs:
            ind_type = config.get("type", "").lower()
            name = config.get("name", ind_type)

            if ind_type not in self.INDICATOR_TYPES:
                raise ValueError(f"Unknown indicator type: {ind_type}. "
                               f"Supported: {list(self.INDICATOR_TYPES.keys())}")

            # Get allowed params for this indicator type
            allowed_params = self.INDICATOR_PARAMS.get(ind_type, set())

            # Extract only relevant parameters, excluding None values
            params = {
                k: v for k, v in config.items()
                if k in allowed_params and v is not None
            }

            # Create indicator instance
            indicator_class = self.INDICATOR_TYPES[ind_type]
            indicator = indicator_class(**params)

            self.manager.add(name, indicator)

        # Handle special cases for composite indicators
        # MACD has signal and histogram that can be referenced
        for name, ind in list(self.manager._indicators.items()):
            if isinstance(ind, MACD):
                # Users can reference "macd_signal" and "macd_histogram"
                pass  # These are accessed via the MACD indicator itself

            if isinstance(ind, BollingerBands):
                # Users can reference "bb_upper", "bb_lower", "bb_middle"
                pass  # These are accessed via the BB indicator itself

    def _parse_rules(self, rules_config: list[dict], signal_type: str) -> list[SignalRule]:
        """Parse rule configurations into SignalRule objects."""
        rules = []

        for rule_config in rules_config:
            conditions = []

            # Each rule can have multiple conditions
            # Simple format: single condition per rule
            # Complex format: "conditions" array

            if "conditions" in rule_config:
                condition_list = rule_config["conditions"]
            else:
                # Single condition format
                condition_list = [rule_config]

            for cond in condition_list:
                indicator = cond.get("indicator", "price")
                operator = ConditionOperator(cond.get("operator", ">"))

                compare_value = None
                compare_indicator = None

                # Check for value first (must be non-None)
                if cond.get("value") is not None:
                    compare_value = Decimal(str(cond["value"]))
                # Then check for compare_to_indicator (must be non-None/non-empty)
                elif cond.get("compare_to_indicator"):
                    compare_indicator = cond["compare_to_indicator"]
                else:
                    raise ValueError(f"Condition must have 'value' or 'compare_to_indicator': {cond}")

                conditions.append(IndicatorCondition(
                    indicator_name=indicator,
                    operator=operator,
                    compare_to_value=compare_value,
                    compare_to_indicator=compare_indicator,
                ))

            rules.append(SignalRule(
                signal_type=signal_type,
                conditions=conditions,
                description=rule_config.get("description", ""),
            ))

        return rules

    def on_start(self) -> None:
        """Reset indicators before backtest starts."""
        self.manager.reset()
        self._prev_values = {}

    def on_trade(self, trade_data: pd.Series, historical_data: pd.DataFrame) -> list[Order]:
        """Process trade and generate orders based on indicator rules."""
        orders = []

        current_price = Decimal(str(trade_data["price"]))

        # Update all indicators
        snapshot = self.manager.update(current_price)

        # Wait for all indicators to be ready
        if not snapshot.all_ready:
            return orders

        # Get current values including price
        current_values = dict(snapshot.values)
        current_values["price"] = current_price

        # Add special indicator values (MACD signal/histogram, BB bands)
        self._add_special_values(current_values)

        # Check buy rules (only if not in position)
        if self.state.position is None:
            if self._check_rules(self.buy_rules, current_values):
                orders.append(Order(
                    side="buy",
                    price=current_price,
                    size=self.order_size,
                    order_type="market",
                ))

        # Check sell rules (only if in long position)
        elif self.state.position is not None and self.state.position.side == "long":
            if self._check_rules(self.sell_rules, current_values):
                orders.append(Order(
                    side="sell",
                    price=current_price,
                    size=self.order_size,
                    order_type="market",
                ))

        # Update previous values for next iteration
        self._prev_values = current_values.copy()

        return orders

    def _add_special_values(self, values: dict) -> None:
        """Add special indicator values (MACD signal, BB bands, etc.)."""
        for name, indicator in self.manager._indicators.items():
            if isinstance(indicator, MACD):
                values[f"{name}_signal"] = indicator.signal
                values[f"{name}_histogram"] = indicator.histogram

            if isinstance(indicator, BollingerBands):
                values[f"{name}_upper"] = indicator.upper
                values[f"{name}_lower"] = indicator.lower
                values[f"{name}_middle"] = indicator.middle
                values[f"{name}_bandwidth"] = indicator.bandwidth

    def _check_rules(self, rules: list[SignalRule], values: dict) -> bool:
        """
        Check if any rule's conditions are all met.

        Rules are OR'd together (any rule can trigger).
        Conditions within a rule are AND'd (all must be true).
        """
        for rule in rules:
            if self._check_conditions(rule.conditions, values):
                return True
        return False

    def _check_conditions(self, conditions: list[IndicatorCondition], values: dict) -> bool:
        """Check if all conditions in a list are met."""
        for cond in conditions:
            if not self._check_single_condition(cond, values):
                return False
        return True

    def _check_single_condition(self, cond: IndicatorCondition, values: dict) -> bool:
        """Evaluate a single condition."""
        # Get the indicator value
        ind_value = values.get(cond.indicator_name)
        if ind_value is None:
            return False

        # Get the comparison value
        if cond.compare_to_value is not None:
            compare_value = cond.compare_to_value
        else:
            compare_value = values.get(cond.compare_to_indicator)
            if compare_value is None:
                return False

        # Evaluate based on operator
        if cond.operator == ConditionOperator.GT:
            return ind_value > compare_value

        elif cond.operator == ConditionOperator.LT:
            return ind_value < compare_value

        elif cond.operator == ConditionOperator.GTE:
            return ind_value >= compare_value

        elif cond.operator == ConditionOperator.LTE:
            return ind_value <= compare_value

        elif cond.operator == ConditionOperator.CROSS_ABOVE:
            prev_value = self._prev_values.get(cond.indicator_name)
            if prev_value is None:
                return False
            # Was below or equal, now above
            return prev_value <= compare_value and ind_value > compare_value

        elif cond.operator == ConditionOperator.CROSS_BELOW:
            prev_value = self._prev_values.get(cond.indicator_name)
            if prev_value is None:
                return False
            # Was above or equal, now below
            return prev_value >= compare_value and ind_value < compare_value

        return False

    def get_indicator_status(self) -> dict:
        """Get current status of all indicators (for debugging/monitoring)."""
        return self.manager.get_status()

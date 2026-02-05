"""
Tests for the CustomStrategy with configurable indicators.
"""

import pytest
from decimal import Decimal
from datetime import datetime, timedelta

import pandas as pd

from app.strategies.custom_strategy import (
    CustomStrategy,
    ConditionOperator,
    IndicatorCondition,
    SignalRule,
)
from app.core.strategy import Order


# =============================================================================
# Fixtures
# =============================================================================

@pytest.fixture
def sample_trade_data():
    """Create a sample trade Series."""
    def _create(price: float, timestamp: datetime = None):
        if timestamp is None:
            timestamp = datetime.now()
        return pd.Series({
            "price": price,
            "side": "buy",
            "size": 100,
            "timestamp": timestamp,
        })
    return _create


@pytest.fixture
def sample_historical_data():
    """Create sample historical DataFrame."""
    def _create(prices: list[float], start_time: datetime = None):
        if start_time is None:
            start_time = datetime(2024, 1, 1, 12, 0, 0)

        trades = []
        for i, price in enumerate(prices):
            trades.append({
                "price": price,
                "side": "buy",
                "size": 100,
                "timestamp": start_time + timedelta(minutes=i),
            })
        return pd.DataFrame(trades)
    return _create


@pytest.fixture
def ema_crossover_config():
    """Standard EMA crossover strategy config."""
    return {
        "indicators": [
            {"type": "ema", "name": "fast_ema", "period": 5},
            {"type": "ema", "name": "slow_ema", "period": 10},
        ],
        "buy_rules": [
            {"indicator": "fast_ema", "operator": ">", "compare_to_indicator": "slow_ema"}
        ],
        "sell_rules": [
            {"indicator": "fast_ema", "operator": "<", "compare_to_indicator": "slow_ema"}
        ],
    }


@pytest.fixture
def rsi_strategy_config():
    """RSI overbought/oversold strategy config."""
    return {
        "indicators": [
            {"type": "rsi", "name": "rsi", "period": 7},
        ],
        "buy_rules": [
            {"indicator": "rsi", "operator": "<", "value": 30}
        ],
        "sell_rules": [
            {"indicator": "rsi", "operator": ">", "value": 70}
        ],
    }


# =============================================================================
# Strategy Creation Tests
# =============================================================================

class TestCustomStrategyCreation:
    """Tests for creating CustomStrategy instances."""

    def test_create_simple_strategy(self, ema_crossover_config):
        """Test creating a simple EMA crossover strategy."""
        strategy = CustomStrategy(
            indicators_config=ema_crossover_config["indicators"],
            buy_rules=ema_crossover_config["buy_rules"],
            sell_rules=ema_crossover_config["sell_rules"],
        )

        assert len(strategy.manager) == 2
        assert "fast_ema" in strategy.manager
        assert "slow_ema" in strategy.manager

    def test_create_with_all_indicator_types(self):
        """Test creating strategy with all supported indicator types."""
        config = {
            "indicators": [
                {"type": "sma", "name": "sma", "period": 10},
                {"type": "ema", "name": "ema", "period": 10},
                {"type": "rsi", "name": "rsi", "period": 14},
                {"type": "macd", "name": "macd", "fast_period": 12, "slow_period": 26, "signal_period": 9},
                {"type": "bollinger", "name": "bb", "period": 20},
            ],
            "buy_rules": [],
            "sell_rules": [],
        }

        strategy = CustomStrategy(
            indicators_config=config["indicators"],
            buy_rules=config["buy_rules"],
            sell_rules=config["sell_rules"],
        )

        assert len(strategy.manager) == 5

    def test_invalid_indicator_type(self):
        """Test that invalid indicator type raises error."""
        config = {
            "indicators": [
                {"type": "invalid_indicator", "name": "test"},
            ],
            "buy_rules": [],
            "sell_rules": [],
        }

        with pytest.raises(ValueError, match="Unknown indicator type"):
            CustomStrategy(
                indicators_config=config["indicators"],
                buy_rules=config["buy_rules"],
                sell_rules=config["sell_rules"],
            )

    def test_rule_parsing(self, ema_crossover_config):
        """Test that rules are parsed correctly."""
        strategy = CustomStrategy(
            indicators_config=ema_crossover_config["indicators"],
            buy_rules=ema_crossover_config["buy_rules"],
            sell_rules=ema_crossover_config["sell_rules"],
        )

        assert len(strategy.buy_rules) == 1
        assert len(strategy.sell_rules) == 1
        assert strategy.buy_rules[0].signal_type == "buy"
        assert strategy.sell_rules[0].signal_type == "sell"

    def test_complex_rule_parsing(self):
        """Test parsing rules with multiple conditions."""
        config = {
            "indicators": [
                {"type": "ema", "name": "ema", "period": 10},
                {"type": "rsi", "name": "rsi", "period": 14},
            ],
            "buy_rules": [
                {
                    "conditions": [
                        {"indicator": "ema", "operator": ">", "value": 100},
                        {"indicator": "rsi", "operator": "<", "value": 70},
                    ],
                    "description": "EMA above 100 and RSI not overbought"
                }
            ],
            "sell_rules": [],
        }

        strategy = CustomStrategy(
            indicators_config=config["indicators"],
            buy_rules=config["buy_rules"],
            sell_rules=config["sell_rules"],
        )

        assert len(strategy.buy_rules) == 1
        assert len(strategy.buy_rules[0].conditions) == 2


# =============================================================================
# Signal Generation Tests
# =============================================================================

def run_strategy_on_prices(strategy, prices, sample_trade_data, sample_historical_data):
    """Helper to simulate backtest loop - processes prices one by one."""
    all_orders = []
    for i, price in enumerate(prices):
        historical = sample_historical_data(prices[:i+1])
        trade = sample_trade_data(price)
        orders = strategy.on_trade(trade, historical)
        all_orders.extend(orders)
    return all_orders


class TestSignalGeneration:
    """Tests for signal generation logic."""

    def test_no_signal_during_warmup(self, sample_trade_data, sample_historical_data):
        """Test that no signals are generated during warmup."""
        strategy = CustomStrategy(
            indicators_config=[{"type": "ema", "name": "ema", "period": 10}],
            buy_rules=[{"indicator": "ema", "operator": ">", "value": 0}],
            sell_rules=[],
        )
        strategy.on_start()

        # Only 5 prices - EMA needs 10
        prices = [100.0 + i for i in range(5)]
        orders = run_strategy_on_prices(strategy, prices, sample_trade_data, sample_historical_data)

        assert len(orders) == 0  # No signal during warmup

    def test_buy_signal_generated(self, sample_trade_data, sample_historical_data):
        """Test that buy signal is generated when conditions are met."""
        strategy = CustomStrategy(
            indicators_config=[{"type": "sma", "name": "sma", "period": 3}],
            buy_rules=[{"indicator": "price", "operator": ">", "compare_to_indicator": "sma"}],
            sell_rules=[],
        )
        strategy.on_start()

        # Prices that will result in price > SMA after warmup
        prices = [100.0, 100.0, 100.0, 110.0]  # After warmup, SMA ~103.3, price = 110
        orders = run_strategy_on_prices(strategy, prices, sample_trade_data, sample_historical_data)

        assert len(orders) == 1
        assert orders[0].side == "buy"

    def test_sell_signal_with_position(self, sample_trade_data, sample_historical_data):
        """Test that sell signal is generated only when in position."""
        strategy = CustomStrategy(
            indicators_config=[{"type": "sma", "name": "sma", "period": 3}],
            buy_rules=[{"indicator": "price", "operator": ">", "compare_to_indicator": "sma"}],
            sell_rules=[{"indicator": "price", "operator": "<", "compare_to_indicator": "sma"}],
        )
        strategy.on_start()

        # Process uptrend to get buy signal
        uptrend_prices = [100.0, 100.0, 100.0, 110.0]
        orders = run_strategy_on_prices(strategy, uptrend_prices, sample_trade_data, sample_historical_data)

        # Should have a buy signal
        assert len(orders) >= 1
        assert orders[0].side == "buy"

        # Simulate entering position
        from app.core.strategy import Position
        strategy.state.position = Position(
            side="long",
            entry_price=Decimal("110"),
            size=Decimal("100"),
            entry_time=pd.Timestamp.now(),
        )

        # Reset indicators for next phase (simulating continued trading)
        # Now price drops - should trigger sell
        strategy.on_start()
        downtrend_prices = [110.0, 110.0, 110.0, 90.0]  # SMA ~103.3, price = 90
        # Re-enter position state
        strategy.state.position = Position(
            side="long",
            entry_price=Decimal("110"),
            size=Decimal("100"),
            entry_time=pd.Timestamp.now(),
        )
        orders = run_strategy_on_prices(strategy, downtrend_prices, sample_trade_data, sample_historical_data)

        sell_orders = [o for o in orders if o.side == "sell"]
        assert len(sell_orders) >= 1

    def test_no_sell_without_position(self, sample_trade_data, sample_historical_data):
        """Test that sell signal is not generated without a position."""
        strategy = CustomStrategy(
            indicators_config=[{"type": "sma", "name": "sma", "period": 3}],
            buy_rules=[],
            sell_rules=[{"indicator": "price", "operator": "<", "compare_to_indicator": "sma"}],
        )
        strategy.on_start()

        # Conditions for sell, but no position
        prices = [110.0, 110.0, 110.0, 90.0]
        orders = run_strategy_on_prices(strategy, prices, sample_trade_data, sample_historical_data)

        assert len(orders) == 0  # No sell without position


# =============================================================================
# Condition Operator Tests
# =============================================================================

class TestConditionOperators:
    """Tests for different condition operators."""

    def test_greater_than(self, sample_trade_data, sample_historical_data):
        """Test greater than operator."""
        strategy = CustomStrategy(
            indicators_config=[{"type": "sma", "name": "sma", "period": 3}],
            buy_rules=[{"indicator": "sma", "operator": ">", "value": 100}],
            sell_rules=[],
        )
        strategy.on_start()

        # SMA should be > 100 after warmup
        prices = [101.0, 102.0, 103.0, 104.0]  # SMA = 103 on last price
        orders = run_strategy_on_prices(strategy, prices, sample_trade_data, sample_historical_data)

        assert len(orders) >= 1

    def test_less_than(self, sample_trade_data, sample_historical_data):
        """Test less than operator."""
        strategy = CustomStrategy(
            indicators_config=[{"type": "sma", "name": "sma", "period": 3}],
            buy_rules=[{"indicator": "sma", "operator": "<", "value": 100}],
            sell_rules=[],
        )
        strategy.on_start()

        # SMA should be < 100 after warmup
        prices = [95.0, 96.0, 97.0, 98.0]  # SMA = 97 on last price
        orders = run_strategy_on_prices(strategy, prices, sample_trade_data, sample_historical_data)

        assert len(orders) >= 1

    def test_greater_than_or_equal(self, sample_trade_data, sample_historical_data):
        """Test greater than or equal operator."""
        strategy = CustomStrategy(
            indicators_config=[{"type": "sma", "name": "sma", "period": 3}],
            buy_rules=[{"indicator": "sma", "operator": ">=", "value": 100}],
            sell_rules=[],
        )
        strategy.on_start()

        # SMA should be >= 100 after warmup
        prices = [99.0, 100.0, 101.0, 100.0]  # SMA = 100.33 on last price
        orders = run_strategy_on_prices(strategy, prices, sample_trade_data, sample_historical_data)

        assert len(orders) >= 1

    def test_compare_to_indicator(self, sample_trade_data, sample_historical_data):
        """Test comparing one indicator to another."""
        strategy = CustomStrategy(
            indicators_config=[
                {"type": "sma", "name": "fast_sma", "period": 3},
                {"type": "sma", "name": "slow_sma", "period": 5},
            ],
            buy_rules=[{"indicator": "fast_sma", "operator": ">", "compare_to_indicator": "slow_sma"}],
            sell_rules=[],
        )
        strategy.on_start()

        # Uptrend - fast SMA should be above slow SMA after warmup
        prices = [100.0, 102.0, 104.0, 106.0, 108.0, 110.0]
        orders = run_strategy_on_prices(strategy, prices, sample_trade_data, sample_historical_data)

        assert len(orders) >= 1


# =============================================================================
# Reset and State Tests
# =============================================================================

class TestStateManagement:
    """Tests for state management and reset."""

    def test_reset_clears_indicators(self, sample_trade_data, sample_historical_data):
        """Test that reset properly clears indicator state."""
        strategy = CustomStrategy(
            indicators_config=[{"type": "ema", "name": "ema", "period": 5}],
            buy_rules=[],
            sell_rules=[],
        )
        strategy.on_start()

        # Process some data
        prices = [100.0 + i for i in range(10)]
        for i, price in enumerate(prices):
            historical = sample_historical_data(prices[:i+1])
            trade = sample_trade_data(price)
            strategy.on_trade(trade, historical)

        # Get value after processing
        first_value = strategy.manager.get_value("ema")

        # Reset and process same data
        strategy.on_start()  # This calls reset

        for i, price in enumerate(prices):
            historical = sample_historical_data(prices[:i+1])
            trade = sample_trade_data(price)
            strategy.on_trade(trade, historical)

        second_value = strategy.manager.get_value("ema")

        # Values should be identical
        assert first_value == second_value

    def test_indicator_status(self, sample_trade_data, sample_historical_data):
        """Test get_indicator_status returns useful info."""
        strategy = CustomStrategy(
            indicators_config=[
                {"type": "ema", "name": "ema", "period": 5},
                {"type": "rsi", "name": "rsi", "period": 7},
            ],
            buy_rules=[],
            sell_rules=[],
        )
        strategy.on_start()

        # Process some data
        prices = [100.0 + i for i in range(10)]
        for i, price in enumerate(prices):
            historical = sample_historical_data(prices[:i+1])
            trade = sample_trade_data(price)
            strategy.on_trade(trade, historical)

        status = strategy.get_indicator_status()

        assert "indicators" in status
        assert "ema" in status["indicators"]
        assert "rsi" in status["indicators"]
        assert status["indicators"]["ema"]["is_ready"] is True


# =============================================================================
# Factory Integration Tests
# =============================================================================

class TestFactoryIntegration:
    """Tests for strategy factory integration."""

    def test_create_via_factory(self):
        """Test creating custom strategy via factory."""
        from app.strategies.factory import create_strategy

        config = {
            "strategy_type": "custom",
            "indicators": [
                {"type": "ema", "name": "fast_ema", "period": 12},
                {"type": "ema", "name": "slow_ema", "period": 26},
            ],
            "buy_rules": [
                {"indicator": "fast_ema", "operator": ">", "compare_to_indicator": "slow_ema"}
            ],
            "sell_rules": [
                {"indicator": "fast_ema", "operator": "<", "compare_to_indicator": "slow_ema"}
            ],
            "order_size": "100",
            "initial_balance": "10000",
        }

        strategy = create_strategy(config)

        assert isinstance(strategy, CustomStrategy)
        assert len(strategy.manager) == 2


# =============================================================================
# Edge Cases
# =============================================================================

class TestEdgeCases:
    """Tests for edge cases and error handling."""

    def test_empty_rules(self, sample_trade_data, sample_historical_data):
        """Test strategy with no rules generates no signals."""
        strategy = CustomStrategy(
            indicators_config=[{"type": "sma", "name": "sma", "period": 3}],
            buy_rules=[],
            sell_rules=[],
        )
        strategy.on_start()

        prices = [100.0, 102.0, 104.0, 106.0]
        orders = run_strategy_on_prices(strategy, prices, sample_trade_data, sample_historical_data)

        assert len(orders) == 0

    def test_multiple_buy_rules_or_logic(self, sample_trade_data, sample_historical_data):
        """Test that multiple buy rules use OR logic (any can trigger)."""
        strategy = CustomStrategy(
            indicators_config=[{"type": "sma", "name": "sma", "period": 3}],
            buy_rules=[
                {"indicator": "sma", "operator": ">", "value": 200},  # Won't match
                {"indicator": "sma", "operator": "<", "value": 150},  # Will match
            ],
            sell_rules=[],
        )
        strategy.on_start()

        prices = [100.0, 102.0, 104.0, 106.0]  # SMA ~104 on last price
        orders = run_strategy_on_prices(strategy, prices, sample_trade_data, sample_historical_data)

        # Second rule should trigger (SMA < 150)
        assert len(orders) >= 1

    def test_conditions_within_rule_and_logic(self, sample_trade_data, sample_historical_data):
        """Test that conditions within a rule use AND logic (all must match)."""
        strategy = CustomStrategy(
            indicators_config=[{"type": "sma", "name": "sma", "period": 3}],
            buy_rules=[
                {
                    "conditions": [
                        {"indicator": "sma", "operator": ">", "value": 100},  # Matches
                        {"indicator": "sma", "operator": "<", "value": 102},  # Doesn't match (SMA ~107)
                    ]
                }
            ],
            sell_rules=[],
        )
        strategy.on_start()

        prices = [100.0, 104.0, 108.0, 110.0]  # SMA ~107.3 on last price
        orders = run_strategy_on_prices(strategy, prices, sample_trade_data, sample_historical_data)

        # Both conditions must match, second doesn't, so no signal
        assert len(orders) == 0

    def test_missing_condition_value(self):
        """Test that missing condition value raises error."""
        with pytest.raises(ValueError, match="Must specify either"):
            IndicatorCondition(
                indicator_name="sma",
                operator=ConditionOperator.GT,
                # Neither compare_to_value nor compare_to_indicator specified
            )

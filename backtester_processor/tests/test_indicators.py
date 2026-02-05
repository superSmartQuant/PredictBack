"""
Comprehensive tests for indicators and IndicatorManager.
"""

import pytest
from decimal import Decimal
from typing import List

from app.indicators import (
    Indicator,
    IndicatorConfig,
    SMA,
    EMA,
    RSI,
    MACD,
    BollingerBands,
    IndicatorManager,
    IndicatorSnapshot,
    ManagerState,
    IndicatorError,
    IndicatorNotReadyError,
    ManagerNotResetError,
    DuplicateIndicatorError,
    IndicatorNotFoundError,
)


# =============================================================================
# Test Fixtures
# =============================================================================

@pytest.fixture
def sample_prices() -> List[Decimal]:
    """Generate sample price data for testing."""
    # Simulates a price series with some trend and volatility
    return [Decimal(str(p)) for p in [
        100.0, 101.5, 102.0, 101.0, 103.0,
        104.5, 103.5, 105.0, 106.0, 104.0,
        105.5, 107.0, 108.0, 107.5, 109.0,
        110.0, 108.5, 109.5, 111.0, 112.0,
        111.0, 113.0, 114.5, 113.5, 115.0,
        116.0, 115.5, 117.0, 118.0, 119.0,
    ]]


@pytest.fixture
def trending_up_prices() -> List[Decimal]:
    """Steadily increasing prices."""
    return [Decimal(str(100 + i)) for i in range(50)]


@pytest.fixture
def trending_down_prices() -> List[Decimal]:
    """Steadily decreasing prices."""
    return [Decimal(str(150 - i)) for i in range(50)]


@pytest.fixture
def flat_prices() -> List[Decimal]:
    """Constant prices."""
    return [Decimal("100")] * 50


# =============================================================================
# SMA Tests
# =============================================================================

class TestSMA:
    """Tests for Simple Moving Average indicator."""

    def test_sma_creation(self):
        """Test SMA creation with valid period."""
        sma = SMA(period=10)
        assert sma.period == 10
        assert sma.config.name == "SMA"
        assert sma.config.warmup_period == 10
        assert sma.config.is_stateful is False

    def test_sma_invalid_period(self):
        """Test SMA rejects invalid period."""
        with pytest.raises(ValueError, match="Period must be >= 1"):
            SMA(period=0)
        with pytest.raises(ValueError, match="Period must be >= 1"):
            SMA(period=-5)

    def test_sma_warmup(self, sample_prices):
        """Test SMA returns None during warmup."""
        sma = SMA(period=5)

        for i, price in enumerate(sample_prices[:4]):
            result = sma.update(price)
            assert result is None
            assert sma.is_ready is False

        # 5th update should produce a value
        result = sma.update(sample_prices[4])
        assert result is not None
        assert sma.is_ready is True

    def test_sma_calculation(self):
        """Test SMA calculates correctly."""
        sma = SMA(period=3)
        prices = [Decimal("10"), Decimal("20"), Decimal("30")]

        sma.update(prices[0])
        sma.update(prices[1])
        result = sma.update(prices[2])

        # SMA of [10, 20, 30] = 60 / 3 = 20
        assert result == Decimal("20")

    def test_sma_sliding_window(self):
        """Test SMA correctly slides window."""
        sma = SMA(period=3)

        sma.update(Decimal("10"))
        sma.update(Decimal("20"))
        sma.update(Decimal("30"))  # SMA = 20

        result = sma.update(Decimal("40"))  # SMA of [20, 30, 40] = 30
        assert result == Decimal("30")

    def test_sma_reset(self):
        """Test SMA reset clears state."""
        sma = SMA(period=3)

        # Process some data
        for p in [Decimal("10"), Decimal("20"), Decimal("30")]:
            sma.update(p)
        assert sma.is_ready is True

        # Reset
        sma.reset()
        assert sma.is_ready is False
        assert sma.value is None
        assert sma._samples_processed == 0


# =============================================================================
# EMA Tests
# =============================================================================

class TestEMA:
    """Tests for Exponential Moving Average indicator."""

    def test_ema_creation(self):
        """Test EMA creation."""
        ema = EMA(period=12)
        assert ema.period == 12
        assert ema.config.name == "EMA"
        assert ema.config.is_stateful is True  # Important!

    def test_ema_invalid_period(self):
        """Test EMA rejects invalid period."""
        with pytest.raises(ValueError):
            EMA(period=0)

    def test_ema_warmup_initializes_with_sma(self, sample_prices):
        """Test EMA initializes with SMA of first N prices."""
        period = 5
        ema = EMA(period=period)

        # First 4 prices - not ready
        for price in sample_prices[:4]:
            result = ema.update(price)
            assert not ema.is_ready

        # 5th price - now ready, value is SMA of first 5
        result = ema.update(sample_prices[4])
        assert ema.is_ready

        expected_sma = sum(sample_prices[:5]) / Decimal(5)
        assert result == expected_sma

    def test_ema_formula(self):
        """Test EMA applies correct formula after warmup."""
        ema = EMA(period=3)

        # Warmup with [10, 20, 30] -> initial EMA = 20
        ema.update(Decimal("10"))
        ema.update(Decimal("20"))
        initial = ema.update(Decimal("30"))
        assert initial == Decimal("20")

        # Now apply EMA formula: EMA = price * k + prev_EMA * (1-k)
        # where k = 2/(period+1) = 2/4 = 0.5
        new_price = Decimal("40")
        result = ema.update(new_price)

        k = Decimal("0.5")  # 2/(3+1)
        expected = new_price * k + initial * (Decimal("1") - k)
        assert result == expected

    def test_ema_stateful_warning(self, sample_prices):
        """Test that EMA state persists without reset (the danger!)."""
        ema = EMA(period=5)

        # First run
        for price in sample_prices[:10]:
            ema.update(price)
        first_run_value = ema.value
        first_run_samples = ema._samples_processed

        # Second run WITHOUT reset - state persists!
        for price in sample_prices[:10]:
            ema.update(price)

        # Samples keep accumulating
        assert ema._samples_processed == first_run_samples + 10
        # Value is different because it continued from previous state
        assert ema.value != first_run_value

    def test_ema_reset_fixes_state(self, sample_prices):
        """Test that reset properly clears EMA state."""
        ema = EMA(period=5)

        # First run
        for price in sample_prices[:10]:
            ema.update(price)
        first_run_value = ema.value

        # Reset and run again with same data
        ema.reset()
        for price in sample_prices[:10]:
            ema.update(price)

        # Should get same result
        assert ema.value == first_run_value


# =============================================================================
# RSI Tests
# =============================================================================

class TestRSI:
    """Tests for Relative Strength Index indicator."""

    def test_rsi_creation(self):
        """Test RSI creation."""
        rsi = RSI(period=14)
        assert rsi.period == 14
        assert rsi.config.warmup_period == 15  # period + 1
        assert rsi.config.is_stateful is True

    def test_rsi_range(self, sample_prices):
        """Test RSI stays within 0-100 range."""
        rsi = RSI(period=7)

        for price in sample_prices:
            result = rsi.update(price)
            if result is not None:
                assert Decimal("0") <= result <= Decimal("100")

    def test_rsi_trending_up(self, trending_up_prices):
        """Test RSI is high during uptrend."""
        rsi = RSI(period=10)

        for price in trending_up_prices:
            rsi.update(price)

        # In a strong uptrend, RSI should be high (>70)
        assert rsi.value > Decimal("70")

    def test_rsi_trending_down(self, trending_down_prices):
        """Test RSI is low during downtrend."""
        rsi = RSI(period=10)

        for price in trending_down_prices:
            rsi.update(price)

        # In a strong downtrend, RSI should be low (<30)
        assert rsi.value < Decimal("30")

    def test_rsi_flat_prices(self, flat_prices):
        """Test RSI with no price changes."""
        rsi = RSI(period=10)

        for price in flat_prices:
            rsi.update(price)

        # No gains or losses means RSI calculation edge case
        # When avg_loss is 0, RSI = 100
        assert rsi.value == Decimal("100")


# =============================================================================
# MACD Tests
# =============================================================================

class TestMACD:
    """Tests for MACD indicator."""

    def test_macd_creation(self):
        """Test MACD creation with default params."""
        macd = MACD()
        assert macd.fast_period == 12
        assert macd.slow_period == 26
        assert macd.signal_period == 9
        assert macd.config.is_stateful is True

    def test_macd_invalid_periods(self):
        """Test MACD rejects invalid period combinations."""
        with pytest.raises(ValueError, match="fast_period must be < slow_period"):
            MACD(fast_period=26, slow_period=12)

        with pytest.raises(ValueError, match="signal_period must be >= 1"):
            MACD(signal_period=0)

    def test_macd_warmup(self, sample_prices):
        """Test MACD warmup period."""
        macd = MACD(fast_period=3, slow_period=5, signal_period=2)
        # Warmup = slow_period + signal_period = 5 + 2 = 7

        for i, price in enumerate(sample_prices[:6]):
            macd.update(price)
            # MACD line might be available after slow_period
            # But signal line needs more

        # After enough data, all should be ready
        for price in sample_prices[6:10]:
            macd.update(price)

        assert macd.value is not None  # MACD line
        assert macd.signal is not None  # Signal line
        assert macd.histogram is not None  # Histogram

    def test_macd_components(self, sample_prices):
        """Test MACD components are calculated correctly."""
        macd = MACD(fast_period=3, slow_period=5, signal_period=2)

        for price in sample_prices[:15]:
            macd.update(price)

        # Histogram should equal MACD - Signal
        if macd.value is not None and macd.signal is not None:
            expected_histogram = macd.value - macd.signal
            assert macd.histogram == expected_histogram


# =============================================================================
# Bollinger Bands Tests
# =============================================================================

class TestBollingerBands:
    """Tests for Bollinger Bands indicator."""

    def test_bollinger_creation(self):
        """Test Bollinger Bands creation."""
        bb = BollingerBands(period=20, num_std=Decimal("2"))
        assert bb.period == 20
        assert bb.num_std == Decimal("2")
        assert bb.config.is_stateful is False

    def test_bollinger_invalid_period(self):
        """Test Bollinger Bands rejects invalid period."""
        with pytest.raises(ValueError, match="Period must be >= 2"):
            BollingerBands(period=1)

    def test_bollinger_bands_order(self, sample_prices):
        """Test that lower < middle < upper always."""
        bb = BollingerBands(period=5)

        for price in sample_prices:
            bb.update(price)
            if bb.is_ready:
                assert bb.lower < bb.middle < bb.upper

    def test_bollinger_middle_is_sma(self, sample_prices):
        """Test that middle band equals SMA."""
        period = 5
        bb = BollingerBands(period=period)
        sma = SMA(period=period)

        for price in sample_prices[:10]:
            bb.update(price)
            sma.update(price)

        assert bb.middle == sma.value

    def test_bollinger_bandwidth(self, sample_prices):
        """Test bandwidth calculation."""
        bb = BollingerBands(period=5)

        for price in sample_prices[:10]:
            bb.update(price)

        if bb.is_ready:
            expected_bandwidth = (bb.upper - bb.lower) / bb.middle
            assert bb.bandwidth == expected_bandwidth


# =============================================================================
# IndicatorManager Tests
# =============================================================================

class TestIndicatorManager:
    """Tests for IndicatorManager."""

    def test_manager_creation(self):
        """Test manager creation."""
        manager = IndicatorManager()
        assert manager.state == ManagerState.UNINITIALIZED
        assert len(manager) == 0

    def test_manager_add_indicators(self):
        """Test adding indicators to manager."""
        manager = IndicatorManager()

        manager.add("sma", SMA(10))
        manager.add("ema", EMA(20))

        assert len(manager) == 2
        assert "sma" in manager
        assert "ema" in manager

    def test_manager_method_chaining(self):
        """Test method chaining works."""
        manager = (
            IndicatorManager()
            .add("sma", SMA(5))
            .add("ema", EMA(10))
            .reset()
        )

        assert len(manager) == 2
        assert manager.state == ManagerState.READY

    def test_manager_duplicate_name_error(self):
        """Test adding duplicate indicator name raises error."""
        manager = IndicatorManager()
        manager.add("my_sma", SMA(10))

        with pytest.raises(DuplicateIndicatorError):
            manager.add("my_sma", SMA(20))

    def test_manager_not_found_error(self):
        """Test accessing non-existent indicator raises error."""
        manager = IndicatorManager()
        manager.add("sma", SMA(10))

        with pytest.raises(IndicatorNotFoundError):
            manager.get("nonexistent")

    def test_manager_requires_reset(self, sample_prices):
        """Test manager enforces reset before processing."""
        manager = IndicatorManager(strict_mode=True)
        manager.add("sma", SMA(5))

        # Should raise because reset wasn't called
        with pytest.raises(ManagerNotResetError):
            manager.update(sample_prices[0])

    def test_manager_update_returns_snapshot(self, sample_prices):
        """Test update returns proper snapshot."""
        manager = IndicatorManager()
        manager.add("sma", SMA(3))
        manager.add("ema", EMA(3))
        manager.reset()

        for price in sample_prices[:5]:
            snapshot = manager.update(price)

        assert isinstance(snapshot, IndicatorSnapshot)
        assert "sma" in snapshot.values
        assert "ema" in snapshot.values
        assert snapshot.samples_processed == 5

    def test_manager_snapshot_ready_status(self, sample_prices):
        """Test snapshot correctly tracks ready status."""
        manager = IndicatorManager()
        manager.add("short", SMA(3))
        manager.add("long", SMA(10))
        manager.reset()

        # After 5 prices: short ready, long not ready
        for price in sample_prices[:5]:
            snapshot = manager.update(price)

        assert snapshot.is_ready("short") is True
        assert snapshot.is_ready("long") is False
        assert snapshot.all_ready is False

        # After 10 prices: both ready
        for price in sample_prices[5:10]:
            snapshot = manager.update(price)

        assert snapshot.all_ready is True

    def test_manager_get_value_not_ready_error(self, sample_prices):
        """Test getting value before ready raises error in strict mode."""
        manager = IndicatorManager(strict_mode=True)
        manager.add("sma", SMA(10))
        manager.reset()

        # Only process 5 prices (need 10)
        for price in sample_prices[:5]:
            manager.update(price)

        with pytest.raises(IndicatorNotReadyError):
            manager.get_value("sma", require_ready=True)

    def test_manager_non_strict_mode(self, sample_prices):
        """Test non-strict mode returns None instead of raising."""
        manager = IndicatorManager(strict_mode=False)
        manager.add("sma", SMA(10))
        manager.reset()

        for price in sample_prices[:5]:
            manager.update(price)

        # Should return None, not raise
        value = manager.get_value("sma", require_ready=True)
        assert value is None

    def test_manager_reset_clears_all(self, sample_prices):
        """Test reset clears all indicator state."""
        manager = IndicatorManager()
        manager.add("ema1", EMA(5))
        manager.add("ema2", EMA(10))
        manager.reset()

        # Process some data
        for price in sample_prices[:15]:
            manager.update(price)

        assert manager.all_ready is True
        assert manager.samples_processed == 15

        # Reset
        manager.reset()

        assert manager.all_ready is False
        assert manager.samples_processed == 0
        assert manager.state == ManagerState.READY

    def test_manager_remove_indicator(self):
        """Test removing indicators."""
        manager = IndicatorManager()
        manager.add("sma", SMA(5))
        manager.add("ema", EMA(10))

        removed = manager.remove("sma")

        assert isinstance(removed, SMA)
        assert "sma" not in manager
        assert len(manager) == 1

    def test_manager_max_warmup_period(self):
        """Test max_warmup_period calculation."""
        manager = IndicatorManager()
        manager.add("short", SMA(5))
        manager.add("medium", EMA(20))
        manager.add("long", RSI(50))

        # RSI warmup = period + 1 = 51
        assert manager.max_warmup_period == 51

    def test_manager_get_status(self, sample_prices):
        """Test get_status returns comprehensive info."""
        manager = IndicatorManager()
        manager.add("sma", SMA(5))
        manager.reset()

        for price in sample_prices[:7]:
            manager.update(price)

        status = manager.get_status()

        assert status["state"] == "RUNNING"
        assert status["samples_processed"] == 7
        assert "sma" in status["indicators"]
        assert status["indicators"]["sma"]["is_ready"] is True

    def test_manager_dirty_state(self, sample_prices):
        """Test adding indicator during run marks state dirty."""
        manager = IndicatorManager()
        manager.add("sma", SMA(5))
        manager.reset()

        for price in sample_prices[:5]:
            manager.update(price)

        # Add new indicator while running
        manager.add("ema", EMA(5))
        assert manager.state == ManagerState.DIRTY

        # Should raise on next update
        with pytest.raises(ManagerNotResetError):
            manager.update(sample_prices[5])

    def test_manager_repr(self):
        """Test manager string representation."""
        manager = IndicatorManager()
        manager.add("fast_sma", SMA(5))
        manager.add("slow_ema", EMA(20))

        repr_str = repr(manager)
        assert "IndicatorManager" in repr_str
        assert "UNINITIALIZED" in repr_str


# =============================================================================
# Integration Tests
# =============================================================================

class TestIndicatorIntegration:
    """Integration tests combining multiple indicators."""

    def test_realistic_strategy_setup(self, sample_prices):
        """Test a realistic strategy indicator setup."""
        manager = IndicatorManager()

        # Common trading setup
        manager.add("fast_ema", EMA(12))
        manager.add("slow_ema", EMA(26))
        manager.add("rsi", RSI(14))
        manager.add("bb", BollingerBands(20))

        manager.reset()

        signals = []
        for price in sample_prices:
            snapshot = manager.update(price)

            if snapshot.all_ready:
                fast = snapshot.get("fast_ema")
                slow = snapshot.get("slow_ema")
                rsi = snapshot.get("rsi")

                # Simple signal logic
                if fast > slow and rsi < Decimal("70"):
                    signals.append("BUY")
                elif fast < slow and rsi > Decimal("30"):
                    signals.append("SELL")
                else:
                    signals.append("HOLD")

        # Should have generated some signals
        assert len(signals) > 0

    def test_multiple_backtest_runs(self, sample_prices, trending_up_prices):
        """Test running multiple backtests with proper reset."""
        manager = IndicatorManager()
        manager.add("ema", EMA(5))

        # First backtest
        manager.reset()
        for price in sample_prices[:10]:
            manager.update(price)
        first_run_value = manager.get_value("ema")

        # Second backtest with different data
        manager.reset()
        for price in trending_up_prices[:10]:
            manager.update(price)
        second_run_value = manager.get_value("ema")

        # Values should be different (different data)
        assert first_run_value != second_run_value

        # Third run with same data as first should match
        manager.reset()
        for price in sample_prices[:10]:
            manager.update(price)
        third_run_value = manager.get_value("ema")

        assert first_run_value == third_run_value

    def test_indicator_independence(self, sample_prices):
        """Test indicators don't affect each other."""
        # Two separate managers with same indicators
        manager1 = IndicatorManager()
        manager1.add("ema", EMA(10))

        manager2 = IndicatorManager()
        manager2.add("ema", EMA(10))

        manager1.reset()
        manager2.reset()

        # Feed same data
        for price in sample_prices[:15]:
            manager1.update(price)
            manager2.update(price)

        # Should produce identical results
        assert manager1.get_value("ema") == manager2.get_value("ema")

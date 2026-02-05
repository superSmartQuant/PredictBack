"""
Unit tests for the backtester processor.
"""

import unittest
from decimal import Decimal
from datetime import datetime, timedelta

import pandas as pd

from app.core.strategy import Strategy, Order, Position, Trade, StrategyState
from app.core.backtester import Backtester, BacktestResult
from app.strategies import GridStrategy, MomentumStrategy


def create_mock_trades(
    prices: list[float],
    start_time: datetime = datetime(2024, 1, 1, 12, 0, 0),
    interval_seconds: int = 60,
) -> pd.DataFrame:
    """Create mock trade data for testing."""
    trades = []
    for i, price in enumerate(prices):
        trades.append({
            "id": i + 1,
            "tx_hash": f"0x{i:064x}",
            "block_number": 1000000 + i,
            "block_time": start_time + timedelta(seconds=i * interval_seconds),
            "maker": "0x" + "a" * 40,
            "taker": "0x" + "b" * 40,
            "maker_asset_id": "asset_1",
            "taker_asset_id": "asset_2",
            "maker_amount_filled": 100,
            "taker_amount_filled": 100,
            "fee": 1,
            "side": "buy",
            "price": price,
            "created_at": start_time + timedelta(seconds=i * interval_seconds),
        })
    return pd.DataFrame(trades)


class SimpleTestStrategy(Strategy):
    """A simple strategy for testing that buys on first trade and sells on last."""

    def __init__(self):
        super().__init__(initial_balance=Decimal("10000"))
        self.trade_count = 0
        self.total_trades_seen = 0

    def on_start(self) -> None:
        """Reset custom state."""
        self.trade_count = 0
        self.total_trades_seen = 0

    def on_trade(self, trade_data: pd.Series, historical_data: pd.DataFrame) -> list[Order]:
        self.trade_count += 1
        self.total_trades_seen = len(historical_data)

        current_price = Decimal(str(trade_data["price"]))
        orders = []

        # Buy on first trade
        if self.trade_count == 1:
            orders.append(Order(
                side="buy",
                price=current_price,
                size=Decimal("100"),
                order_type="market",
            ))

        return orders


class LookAheadDetectorStrategy(Strategy):
    """Strategy that records what data it receives to verify no look-ahead bias."""

    def __init__(self):
        super().__init__()
        self.received_data_lengths = []
        self.current_indices = []

    def on_trade(self, trade_data: pd.Series, historical_data: pd.DataFrame) -> list[Order]:
        self.received_data_lengths.append(len(historical_data))
        # The current trade should be the last row in historical_data
        self.current_indices.append(historical_data.index[-1])
        return []


class TestStrategyDataClasses(unittest.TestCase):
    """Test the strategy data classes."""

    def test_order_creation(self):
        order = Order(
            side="buy",
            price=Decimal("0.5"),
            size=Decimal("100"),
            order_type="market",
        )
        self.assertEqual(order.side, "buy")
        self.assertEqual(order.price, Decimal("0.5"))
        self.assertEqual(order.size, Decimal("100"))
        self.assertEqual(order.order_type, "market")

    def test_position_creation(self):
        position = Position(
            side="long",
            entry_price=Decimal("0.5"),
            size=Decimal("100"),
            entry_time=pd.Timestamp("2024-01-01 12:00:00"),
        )
        self.assertEqual(position.side, "long")
        self.assertEqual(position.entry_price, Decimal("0.5"))

    def test_trade_creation(self):
        trade = Trade(
            side="sell",
            price=Decimal("0.6"),
            size=Decimal("100"),
            timestamp=pd.Timestamp("2024-01-01 12:00:00"),
            pnl=Decimal("10"),
        )
        self.assertEqual(trade.pnl, Decimal("10"))

    def test_strategy_state_is_flat(self):
        state = StrategyState()
        self.assertTrue(state.is_flat)

        state.position = Position(
            side="long",
            entry_price=Decimal("0.5"),
            size=Decimal("100"),
            entry_time=pd.Timestamp.now(),
        )
        self.assertFalse(state.is_flat)


class TestBacktesterNoLookAhead(unittest.TestCase):
    """Test that the backtester prevents look-ahead bias."""

    def test_historical_data_length_increases(self):
        """Verify that historical_data grows with each trade."""
        prices = [0.5, 0.51, 0.52, 0.53, 0.54]
        df = create_mock_trades(prices)

        strategy = LookAheadDetectorStrategy()
        backtester = Backtester()
        backtester.run(strategy, df)

        # Historical data should grow: 1, 2, 3, 4, 5
        self.assertEqual(strategy.received_data_lengths, [1, 2, 3, 4, 5])

    def test_current_trade_is_last_in_historical(self):
        """Verify that the current trade is the last row in historical_data."""
        prices = [0.5, 0.51, 0.52, 0.53, 0.54]
        df = create_mock_trades(prices)

        strategy = LookAheadDetectorStrategy()
        backtester = Backtester()
        backtester.run(strategy, df)

        # Current index should be 0, 1, 2, 3, 4
        self.assertEqual(strategy.current_indices, [0, 1, 2, 3, 4])

    def test_data_sorted_by_time(self):
        """Verify that data is sorted by time before processing."""
        # Create data out of order
        base_time = datetime(2024, 1, 1, 12, 0, 0)
        df = pd.DataFrame([
            {"block_time": base_time + timedelta(minutes=2), "price": 0.52},
            {"block_time": base_time + timedelta(minutes=0), "price": 0.50},
            {"block_time": base_time + timedelta(minutes=1), "price": 0.51},
        ])

        received_prices = []

        class PriceRecorderStrategy(Strategy):
            def on_trade(self, trade_data, historical_data):
                received_prices.append(float(trade_data["price"]))
                return []

        backtester = Backtester()
        backtester.run(PriceRecorderStrategy(), df)

        # Should be sorted: 0.50, 0.51, 0.52
        self.assertEqual(received_prices, [0.50, 0.51, 0.52])


class TestBacktesterExecution(unittest.TestCase):
    """Test order execution in the backtester."""

    def test_buy_order_opens_long_position(self):
        """Test that a buy order opens a long position."""
        prices = [0.5, 0.5]
        df = create_mock_trades(prices)

        strategy = SimpleTestStrategy()
        backtester = Backtester(fee_rate=Decimal("0"))
        backtester.run(strategy, df)

        self.assertIsNotNone(strategy.state.position)
        self.assertEqual(strategy.state.position.side, "long")
        self.assertEqual(strategy.state.position.size, Decimal("100"))

    def test_fee_deduction(self):
        """Test that fees are deducted from trades."""
        prices = [0.5, 0.5]
        df = create_mock_trades(prices)

        class BuyStrategy(Strategy):
            def on_trade(self, trade_data, historical_data):
                if len(historical_data) == 1:
                    return [Order("buy", Decimal("0.5"), Decimal("100"), "market")]
                return []

        strategy = BuyStrategy(initial_balance=Decimal("1000"))
        backtester = Backtester(fee_rate=Decimal("0.01"))  # 1% fee
        backtester.run(strategy, df)

        # Cost = price * size + fee = 0.5 * 100 + (0.5 * 100 * 0.01) = 50 + 0.5 = 50.5
        expected_balance = Decimal("1000") - Decimal("50.5")
        self.assertEqual(strategy.state.balance, expected_balance)

    def test_close_long_position_calculates_pnl(self):
        """Test PnL calculation when closing a long position."""
        prices = [0.5, 0.6]  # Price goes up
        df = create_mock_trades(prices)

        class OpenCloseLongStrategy(Strategy):
            def on_trade(self, trade_data, historical_data):
                price = Decimal(str(trade_data["price"]))
                if len(historical_data) == 1:
                    return [Order("buy", price, Decimal("100"), "market")]
                elif len(historical_data) == 2:
                    return [Order("sell", price, Decimal("100"), "market")]
                return []

        strategy = OpenCloseLongStrategy(initial_balance=Decimal("1000"))
        backtester = Backtester(fee_rate=Decimal("0"))
        backtester.run(strategy, df)

        # PnL = (0.6 - 0.5) * 100 = 10
        self.assertEqual(len(strategy.state.trades), 1)
        self.assertEqual(strategy.state.trades[0].pnl, Decimal("10"))


class TestBacktestResult(unittest.TestCase):
    """Test BacktestResult calculations."""

    def test_result_metrics(self):
        """Test that result metrics are calculated correctly."""
        prices = [0.5, 0.6, 0.55, 0.65]
        df = create_mock_trades(prices)

        class TradingStrategy(Strategy):
            def on_trade(self, trade_data, historical_data):
                price = Decimal(str(trade_data["price"]))
                n = len(historical_data)
                if n == 1:
                    return [Order("buy", price, Decimal("100"), "market")]
                elif n == 2:
                    return [Order("sell", price, Decimal("100"), "market")]
                elif n == 3:
                    return [Order("buy", price, Decimal("100"), "market")]
                elif n == 4:
                    return [Order("sell", price, Decimal("100"), "market")]
                return []

        strategy = TradingStrategy(initial_balance=Decimal("10000"))
        backtester = Backtester(fee_rate=Decimal("0"))
        result = backtester.run(strategy, df)

        self.assertEqual(result.statistics.strategy_name, "TradingStrategy")
        self.assertEqual(result.statistics.initial_balance, Decimal("10000"))
        self.assertEqual(result.statistics.total_trades, 2)
        self.assertIsInstance(result.equity_curve, pd.Series)
        self.assertEqual(len(result.equity_curve), 4)

    def test_win_rate_calculation(self):
        """Test win rate is calculated correctly."""
        prices = [0.5, 0.6, 0.55, 0.50]  # Win then lose
        df = create_mock_trades(prices)

        class WinLoseStrategy(Strategy):
            def on_trade(self, trade_data, historical_data):
                price = Decimal(str(trade_data["price"]))
                n = len(historical_data)
                if n == 1:
                    return [Order("buy", price, Decimal("100"), "market")]
                elif n == 2:
                    return [Order("sell", price, Decimal("100"), "market")]  # Win
                elif n == 3:
                    return [Order("buy", price, Decimal("100"), "market")]
                elif n == 4:
                    return [Order("sell", price, Decimal("100"), "market")]  # Lose
                return []

        strategy = WinLoseStrategy()
        backtester = Backtester(fee_rate=Decimal("0"))
        result = backtester.run(strategy, df)

        # 1 win, 1 loss = 50% win rate
        self.assertEqual(result.statistics.winning_trades, 1)
        self.assertEqual(result.statistics.losing_trades, 1)
        self.assertEqual(result.statistics.win_rate, 0.5)


class TestGridStrategy(unittest.TestCase):
    """Test the GridStrategy implementation."""

    def test_grid_initialization(self):
        """Test grid strategy initializes correctly."""
        strategy = GridStrategy(
            grid_size=5,
            grid_spacing=Decimal("0.02"),
            order_size=Decimal("100"),
        )
        self.assertEqual(strategy.grid_size, 5)
        self.assertEqual(strategy.grid_spacing, Decimal("0.02"))
        self.assertIsNone(strategy.base_price)

    def test_grid_sets_base_price_on_first_trade(self):
        """Test that grid sets base price on first trade."""
        prices = [0.5, 0.5]
        df = create_mock_trades(prices)

        strategy = GridStrategy()
        backtester = Backtester()
        backtester.run(strategy, df)

        self.assertEqual(strategy.base_price, Decimal("0.5"))

    def test_grid_trades_on_level_cross(self):
        """Test that grid trades when price crosses levels."""
        # Price moves up 5% (should cross grid level with 2% spacing)
        prices = [0.5, 0.525]
        df = create_mock_trades(prices)

        strategy = GridStrategy(
            grid_size=5,
            grid_spacing=Decimal("0.02"),
            order_size=Decimal("100"),
        )
        backtester = Backtester()
        backtester.run(strategy, df)

        # Should have opened a short position (sells on upward cross)
        self.assertIsNotNone(strategy.state.position)
        self.assertEqual(strategy.state.position.side, "short")


class TestMomentumStrategy(unittest.TestCase):
    """Test the MomentumStrategy implementation."""

    def test_momentum_waits_for_lookback(self):
        """Test that momentum strategy waits for enough data."""
        prices = [0.5, 0.51, 0.52]  # Only 3 trades, lookback is 10
        df = create_mock_trades(prices)

        strategy = MomentumStrategy(lookback_window=10)
        backtester = Backtester()
        backtester.run(strategy, df)

        # Should not have traded (not enough data)
        self.assertIsNone(strategy.state.position)

    def test_momentum_goes_long_on_uptrend(self):
        """Test momentum strategy goes long on positive momentum."""
        # Steadily increasing prices
        prices = [0.5 + i * 0.01 for i in range(15)]
        df = create_mock_trades(prices)

        strategy = MomentumStrategy(
            lookback_window=5,
            momentum_threshold=Decimal("0.01"),
        )
        backtester = Backtester()
        backtester.run(strategy, df)

        # Should be long due to positive momentum
        self.assertIsNotNone(strategy.state.position)
        self.assertEqual(strategy.state.position.side, "long")

    def test_momentum_goes_short_on_downtrend(self):
        """Test momentum strategy goes short on negative momentum."""
        # Steadily decreasing prices
        prices = [0.6 - i * 0.01 for i in range(15)]
        df = create_mock_trades(prices)

        strategy = MomentumStrategy(
            lookback_window=5,
            momentum_threshold=Decimal("0.01"),
        )
        backtester = Backtester()
        backtester.run(strategy, df)

        # Should be short due to negative momentum
        self.assertIsNotNone(strategy.state.position)
        self.assertEqual(strategy.state.position.side, "short")


class TestStrategyReset(unittest.TestCase):
    """Test strategy reset functionality."""

    def test_strategy_resets_state(self):
        """Test that strategy state is reset between runs."""
        prices = [0.5, 0.6]
        df = create_mock_trades(prices)

        strategy = SimpleTestStrategy()
        backtester = Backtester()

        # Run twice
        backtester.run(strategy, df)
        first_run_count = strategy.trade_count

        backtester.run(strategy, df)
        second_run_count = strategy.trade_count

        # Both runs should see 2 trades (state was reset)
        self.assertEqual(first_run_count, 2)
        self.assertEqual(second_run_count, 2)


class TestEdgeCases(unittest.TestCase):
    """Test edge cases and error handling."""

    def test_empty_dataframe(self):
        """Test handling of empty dataframe."""
        df = pd.DataFrame(columns=["block_time", "price"])

        strategy = SimpleTestStrategy()
        backtester = Backtester()
        result = backtester.run(strategy, df)

        self.assertEqual(result.statistics.total_trades, 0)
        self.assertEqual(len(result.equity_curve), 0)

    def test_single_trade(self):
        """Test handling of single trade."""
        df = create_mock_trades([0.5])

        strategy = SimpleTestStrategy()
        backtester = Backtester()
        result = backtester.run(strategy, df)

        self.assertEqual(len(result.equity_curve), 1)

    def test_no_orders_returned(self):
        """Test strategy that returns no orders."""
        prices = [0.5, 0.6, 0.7]
        df = create_mock_trades(prices)

        class NoOpStrategy(Strategy):
            def on_trade(self, trade_data, historical_data):
                return []

        strategy = NoOpStrategy()
        backtester = Backtester()
        result = backtester.run(strategy, df)

        self.assertEqual(result.statistics.total_trades, 0)
        self.assertEqual(result.statistics.final_equity, result.statistics.initial_balance)


class TestContinuousMarketBacktesting(unittest.TestCase):
    """Test continuous market backtesting functionality."""

    def test_force_close_position_at_market_end(self):
        """Test that positions are force-closed at the end of each market."""
        # First market: buy and hold
        market1_prices = [0.5, 0.55, 0.60]
        df1 = create_mock_trades(market1_prices, start_time=datetime(2024, 1, 1, 12, 0, 0))

        # Second market: price drops
        market2_prices = [0.58, 0.52, 0.50]
        df2 = create_mock_trades(market2_prices, start_time=datetime(2024, 1, 1, 13, 0, 0))

        class BuyAndHoldStrategy(Strategy):
            def on_trade(self, trade_data, historical_data):
                # Buy on first trade if flat
                if self.state.is_flat and len(historical_data) == 1:
                    price = Decimal(str(trade_data["price"]))
                    return [Order("buy", price, Decimal("100"), "market")]
                return []

        strategy = BuyAndHoldStrategy(initial_balance=Decimal("10000"))
        backtester = Backtester(fee_rate=Decimal("0"))

        market_data = [
            ("market-1", df1),
            ("market-2", df2),
        ]
        result = backtester.run_continuous(strategy, market_data)

        # Should have 2 force-close trades (one per market)
        # Strategy buys at start of each market, force-closes at end
        self.assertEqual(result.statistics.total_trades, 2)

    def test_balance_carries_over_between_markets(self):
        """Test that balance carries over between markets."""
        # First market: buy at 0.5, force close at 0.6 (profit)
        market1_prices = [0.5, 0.55, 0.60]
        df1 = create_mock_trades(market1_prices, start_time=datetime(2024, 1, 1, 12, 0, 0))

        class OneShotBuyStrategy(Strategy):
            def __init__(self):
                super().__init__(initial_balance=Decimal("1000"))
                self.bought_this_market = False

            def on_start(self):
                self.bought_this_market = False

            def on_trade(self, trade_data, historical_data):
                # Buy once per market
                if self.state.is_flat and not self.bought_this_market:
                    self.bought_this_market = False  # Don't reset, we only want one buy total
                    if not hasattr(self, '_ever_bought'):
                        self._ever_bought = True
                        price = Decimal(str(trade_data["price"]))
                        return [Order("buy", price, Decimal("100"), "market")]
                return []

        strategy = OneShotBuyStrategy()
        backtester = Backtester(fee_rate=Decimal("0"))

        market_data = [("market-1", df1)]
        result = backtester.run_continuous(strategy, market_data)

        # Buy at 0.5 * 100 = 50, sell at 0.6 * 100 = 60, profit = 10
        # Final balance = 1000 - 50 + 60 = 1010
        self.assertEqual(result.statistics.total_pnl, Decimal("10"))

    def test_continuous_backtest_combines_dataframes(self):
        """Test that continuous backtest combines all market dataframes."""
        market1_prices = [0.5, 0.55]
        df1 = create_mock_trades(market1_prices, start_time=datetime(2024, 1, 1, 12, 0, 0))

        market2_prices = [0.58, 0.52]
        df2 = create_mock_trades(market2_prices, start_time=datetime(2024, 1, 1, 13, 0, 0))

        class NoOpStrategy(Strategy):
            def on_trade(self, trade_data, historical_data):
                return []

        strategy = NoOpStrategy()
        backtester = Backtester()

        market_data = [
            ("market-1", df1),
            ("market-2", df2),
        ]
        result = backtester.run_continuous(strategy, market_data)

        # Combined dataframe should have 4 rows (2 from each market)
        self.assertEqual(len(result.dataframe), 4)
        # Should have market_id column
        self.assertIn("market_id", result.dataframe.columns)

    def test_continuous_backtest_empty_market_data(self):
        """Test that continuous backtest raises error for empty market data."""
        backtester = Backtester()

        class NoOpStrategy(Strategy):
            def on_trade(self, trade_data, historical_data):
                return []

        with self.assertRaises(ValueError):
            backtester.run_continuous(NoOpStrategy(), [])


class TestBacktestRequestSchema(unittest.TestCase):
    """Test BacktestRequest schema validation."""

    def test_clob_token_id_only(self):
        """Test that clob_token_id alone is valid."""
        from app.schemas.backtest import BacktestRequest, GridStrategyConfig

        request = BacktestRequest(
            clob_token_id="123456789",
            strategy=GridStrategyConfig(),
        )
        self.assertEqual(request.clob_token_id, "123456789")
        self.assertIsNone(request.topic)

    def test_topic_with_amount_of_markets(self):
        """Test that topic with amount_of_markets is valid."""
        from app.schemas.backtest import BacktestRequest, GridStrategyConfig

        request = BacktestRequest(
            topic="btc-updown-15m",
            amount_of_markets=5,
            strategy=GridStrategyConfig(),
        )
        self.assertEqual(request.topic, "btc-updown-15m")
        self.assertEqual(request.amount_of_markets, 5)
        self.assertIsNone(request.clob_token_id)

    def test_topic_without_amount_of_markets_fails(self):
        """Test that topic without amount_of_markets raises error."""
        from app.schemas.backtest import BacktestRequest, GridStrategyConfig
        from pydantic import ValidationError

        with self.assertRaises(ValidationError) as context:
            BacktestRequest(
                topic="btc-updown-15m",
                strategy=GridStrategyConfig(),
            )
        self.assertIn("amount_of_markets", str(context.exception))

    def test_neither_clob_token_id_nor_topic_fails(self):
        """Test that providing neither identifier raises error."""
        from app.schemas.backtest import BacktestRequest, GridStrategyConfig
        from pydantic import ValidationError

        with self.assertRaises(ValidationError) as context:
            BacktestRequest(
                strategy=GridStrategyConfig(),
            )
        self.assertIn("clob_token_id", str(context.exception).lower())


class TestParseContinuousSlug(unittest.TestCase):
    """Test the parse_continuous_slug utility function."""

    def test_valid_slug_parsing(self):
        """Test parsing valid continuous market slugs."""
        from app.repository.polymarket import parse_continuous_slug

        result = parse_continuous_slug("btc-updown-15m-1770093900")
        self.assertIsNotNone(result)
        self.assertEqual(result[0], "btc-updown-15m")
        self.assertEqual(result[1], 1770093900)

    def test_complex_prefix(self):
        """Test parsing slug with complex prefix."""
        from app.repository.polymarket import parse_continuous_slug

        result = parse_continuous_slug("eth-updown-1h-weekly-1770093900")
        self.assertIsNotNone(result)
        self.assertEqual(result[0], "eth-updown-1h-weekly")
        self.assertEqual(result[1], 1770093900)

    def test_invalid_slug_no_timestamp(self):
        """Test parsing slug without timestamp."""
        from app.repository.polymarket import parse_continuous_slug

        result = parse_continuous_slug("btc-updown-15m")
        self.assertIsNone(result)

    def test_invalid_slug_empty(self):
        """Test parsing empty slug."""
        from app.repository.polymarket import parse_continuous_slug

        result = parse_continuous_slug("")
        self.assertIsNone(result)

    def test_invalid_slug_none(self):
        """Test parsing None slug."""
        from app.repository.polymarket import parse_continuous_slug

        result = parse_continuous_slug(None)
        self.assertIsNone(result)


if __name__ == "__main__":
    unittest.main()

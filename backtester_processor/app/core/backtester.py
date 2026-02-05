"""
Backtester processor for running strategies on historical trade data.
Ensures no look-ahead bias by processing trades chronologically.
"""

from dataclasses import dataclass
from decimal import Decimal
from typing import Optional
import pandas as pd

from app.core.strategy import Strategy, Order, Trade, Position


@dataclass
class BacktestStatistics:
    """Statistics from a backtest run."""
    strategy_name: str
    initial_balance: Decimal
    final_equity: Decimal
    total_pnl: Decimal
    total_return_pct: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    win_rate: float
    max_drawdown: Decimal
    max_drawdown_pct: float
    sharpe_ratio: Optional[float]
    trades: list[Trade]
    equity_curve: pd.Series

    def __str__(self) -> str:
        return (
            f"=== Backtest Results: {self.strategy_name} ===\n"
            f"Initial Balance: {self.initial_balance}\n"
            f"Final Equity:    {self.final_equity}\n"
            f"Total PnL:       {self.total_pnl} ({self.total_return_pct:.2f}%)\n"
            f"Total Trades:    {self.total_trades}\n"
            f"Win Rate:        {self.win_rate * 100:.2f}%\n"
            f"Max Drawdown:    {self.max_drawdown} ({self.max_drawdown_pct:.2f}%)\n"
        )


class BacktestResult:
    """Complete backtest result with statistics and detailed DataFrame."""

    def __init__(self, statistics: BacktestStatistics, dataframe: pd.DataFrame):
        self._statistics = statistics
        self._dataframe = dataframe

    @property
    def statistics(self) -> BacktestStatistics:
        """Get backtest statistics."""
        return self._statistics

    @property
    def dataframe(self) -> pd.DataFrame:
        """Get detailed DataFrame with equity, cash, PnL, position at each step."""
        return self._dataframe

    @property
    def equity_curve(self) -> pd.Series:
        """Get equity curve series."""
        return self._statistics.equity_curve

    def __str__(self) -> str:
        return str(self._statistics)


class Backtester:
    """
    Backtester processor that runs strategies on historical data.

    Key features:
    - No look-ahead bias: only provides data up to current timestamp
    - Processes trades chronologically
    - Tracks equity curve throughout
    - Supports continuous market backtesting across multiple sequential markets
    """

    def __init__(self, fee_rate: Decimal = Decimal("0.001")):
        """
        Initialize backtester.

        Args:
            fee_rate: Trading fee as decimal (0.001 = 0.1%)
        """
        self.fee_rate = fee_rate

    def _force_close_position(
        self,
        strategy: Strategy,
        current_price: Decimal,
        current_time: pd.Timestamp,
    ) -> None:
        """
        Force close any open position at market end.
        Used for continuous market transitions.
        """
        if strategy.state.position is None:
            return

        pos = strategy.state.position
        fee = current_price * pos.size * self.fee_rate

        if pos.side == "long":
            # Close long: sell to exit
            pnl = (current_price - pos.entry_price) * pos.size - pos.entry_fee - fee
            trade = Trade(
                side="sell",
                price=current_price,
                size=pos.size,
                timestamp=current_time,
                pnl=pnl,
            )
            strategy.state.trades.append(trade)
            strategy.state.balance += current_price * pos.size - fee
        else:
            # Close short: buy to exit
            pnl = (pos.entry_price - current_price) * pos.size - pos.entry_fee - fee
            trade = Trade(
                side="buy",
                price=current_price,
                size=pos.size,
                timestamp=current_time,
                pnl=pnl,
            )
            strategy.state.trades.append(trade)
            strategy.state.balance -= current_price * pos.size + fee

        strategy.state.position = None

    def run_continuous(
        self,
        strategy: Strategy,
        market_data: list[tuple[str, pd.DataFrame]],
        price_col: str = "price",
        time_col: str = "block_time",
    ) -> BacktestResult:
        """
        Run a backtest across multiple continuous markets.

        At the end of each market, any open position is force-closed (realizing PnL),
        and trading continues in the next market with the accumulated balance.

        Args:
            strategy: Strategy instance to test
            market_data: List of (market_id, DataFrame) tuples, sorted chronologically
            price_col: Name of the price column
            time_col: Name of the timestamp column

        Returns:
            BacktestResult with combined statistics and dataframe
        """
        if not market_data:
            raise ValueError("No market data provided")

        strategy.reset()
        all_records = []
        all_dfs = []

        for market_idx, (market_id, data) in enumerate(market_data):
            if data.empty:
                continue

            df = data.sort_values(time_col).reset_index(drop=True)
            df["market_id"] = market_id

            for i in range(len(df)):
                current_trade = df.iloc[i]
                historical_data = df.iloc[: i + 1].copy()

                orders = strategy.on_trade(current_trade, historical_data)

                current_price = Decimal(str(current_trade[price_col]))
                current_time = pd.Timestamp(current_trade[time_col])

                for order in orders:
                    self._execute_order(strategy, order, current_price, current_time)

                # Calculate current state
                equity = self._calculate_equity(strategy, current_price)
                cash = strategy.state.balance
                realized_pnl = sum(t.pnl for t in strategy.state.trades)

                if strategy.state.position:
                    pos = strategy.state.position
                    position_size = float(pos.size) if pos.side == "long" else -float(pos.size)
                    position_side = pos.side
                    if pos.side == "long":
                        unrealized = (current_price - pos.entry_price) * pos.size
                    else:
                        unrealized = (pos.entry_price - current_price) * pos.size
                else:
                    position_size = 0.0
                    position_side = "flat"
                    unrealized = Decimal("0")

                all_records.append({
                    "time": current_time,
                    "equity": float(equity),
                    "cash": float(cash),
                    "realized_pnl": float(realized_pnl),
                    "unrealized_pnl": float(unrealized),
                    "position_size": position_size,
                    "position_side": position_side,
                    "market_id": market_id,
                })

            # At end of market, force close any open position
            if not df.empty and strategy.state.position is not None:
                last_trade = df.iloc[-1]
                last_price = Decimal(str(last_trade[price_col]))
                last_time = pd.Timestamp(last_trade[time_col])
                self._force_close_position(strategy, last_price, last_time)

                # Update the last record with closed position state
                if all_records:
                    equity = self._calculate_equity(strategy, last_price)
                    all_records[-1]["equity"] = float(equity)
                    all_records[-1]["cash"] = float(strategy.state.balance)
                    all_records[-1]["realized_pnl"] = float(sum(t.pnl for t in strategy.state.trades))
                    all_records[-1]["unrealized_pnl"] = 0.0
                    all_records[-1]["position_size"] = 0.0
                    all_records[-1]["position_side"] = "flat"

            all_dfs.append(df)

        strategy.on_end()

        # Combine all dataframes
        if all_dfs:
            result_df = pd.concat(all_dfs, ignore_index=True)
        else:
            result_df = pd.DataFrame()

        if all_records:
            state_df = pd.DataFrame(all_records)
            for col in ["equity", "cash", "realized_pnl", "unrealized_pnl", "position_size", "position_side", "market_id"]:
                if col in state_df.columns:
                    result_df[col] = state_df[col].values
            equity_series = state_df.set_index("time")["equity"]
        else:
            for col in ["equity", "cash", "realized_pnl", "unrealized_pnl", "position_size", "position_side"]:
                result_df[col] = pd.Series(dtype=float)
            equity_series = pd.Series(dtype=float)

        statistics = self._build_statistics(strategy, equity_series)

        return BacktestResult(statistics=statistics, dataframe=result_df)

    def run(
        self,
        strategy: Strategy,
        data: pd.DataFrame,
        price_col: str = "price",
        time_col: str = "block_time",
    ) -> BacktestResult:
        """
        Run a backtest on historical data.

        Args:
            strategy: Strategy instance to test
            data: DataFrame with trade data (must have price and time columns)
            price_col: Name of the price column
            time_col: Name of the timestamp column

        Returns:
            BacktestResult with .statistics and .dataframe
        """
        df = data.sort_values(time_col).reset_index(drop=True)
        strategy.reset()

        records = []

        for i in range(len(df)):
            current_trade = df.iloc[i]
            historical_data = df.iloc[: i + 1].copy()

            orders = strategy.on_trade(current_trade, historical_data)

            current_price = Decimal(str(current_trade[price_col]))
            current_time = pd.Timestamp(current_trade[time_col])

            for order in orders:
                self._execute_order(strategy, order, current_price, current_time)

            # Calculate current state
            equity = self._calculate_equity(strategy, current_price)
            cash = strategy.state.balance
            realized_pnl = sum(t.pnl for t in strategy.state.trades)

            if strategy.state.position:
                pos = strategy.state.position
                position_size = float(pos.size) if pos.side == "long" else -float(pos.size)
                position_side = pos.side
                if pos.side == "long":
                    unrealized = (current_price - pos.entry_price) * pos.size
                else:
                    unrealized = (pos.entry_price - current_price) * pos.size
            else:
                position_size = 0.0
                position_side = "flat"
                unrealized = Decimal("0")

            records.append({
                "time": current_time,
                "equity": float(equity),
                "cash": float(cash),
                "realized_pnl": float(realized_pnl),
                "unrealized_pnl": float(unrealized),
                "position_size": position_size,
                "position_side": position_side,
            })

        strategy.on_end()

        # Build detailed dataframe
        result_df = df.copy()
        if records:
            state_df = pd.DataFrame(records)
            for col in ["equity", "cash", "realized_pnl", "unrealized_pnl", "position_size", "position_side"]:
                result_df[col] = state_df[col]
            equity_series = state_df.set_index("time")["equity"]
        else:
            for col in ["equity", "cash", "realized_pnl", "unrealized_pnl", "position_size", "position_side"]:
                result_df[col] = pd.Series(dtype=float)
            equity_series = pd.Series(dtype=float)

        statistics = self._build_statistics(strategy, equity_series)

        return BacktestResult(statistics=statistics, dataframe=result_df)

    def _execute_order(
        self,
        strategy: Strategy,
        order: Order,
        current_price: Decimal,
        current_time: pd.Timestamp,
    ) -> None:
        """Execute an order and update strategy state."""
        exec_price = current_price if order.order_type == "market" else order.price
        fee = exec_price * order.size * self.fee_rate

        if order.side == "buy":
            if strategy.state.position is None:
                # Open long position: pay price * size + fee
                cost = exec_price * order.size + fee
                strategy.state.balance -= cost
                strategy.state.position = Position(
                    side="long",
                    entry_price=exec_price,
                    size=order.size,
                    entry_time=current_time,
                    entry_fee=fee,
                )
            elif strategy.state.position.side == "short":
                # Close short position: pay to buy back
                pos = strategy.state.position
                # Short PnL = (entry - exit) * size - entry_fee - exit_fee
                pnl = (pos.entry_price - exec_price) * pos.size - pos.entry_fee - fee

                trade = Trade(
                    side="buy",
                    price=exec_price,
                    size=pos.size,
                    timestamp=current_time,
                    pnl=pnl,
                )
                strategy.state.trades.append(trade)
                # When closing short: we had received entry_price * size, now pay exit_price * size + fee
                strategy.state.balance -= exec_price * pos.size + fee
                strategy.state.position = None

        elif order.side == "sell":
            if strategy.state.position is None:
                # Open short position: receive price * size - fee
                proceeds = exec_price * order.size - fee
                strategy.state.balance += proceeds
                strategy.state.position = Position(
                    side="short",
                    entry_price=exec_price,
                    size=order.size,
                    entry_time=current_time,
                    entry_fee=fee,
                )
            elif strategy.state.position.side == "long":
                # Close long position: receive sale proceeds
                pos = strategy.state.position
                # Long PnL = (exit - entry) * size - entry_fee - exit_fee
                pnl = (exec_price - pos.entry_price) * pos.size - pos.entry_fee - fee

                trade = Trade(
                    side="sell",
                    price=exec_price,
                    size=pos.size,
                    timestamp=current_time,
                    pnl=pnl,
                )
                strategy.state.trades.append(trade)
                # When closing long: receive exit_price * size - fee
                strategy.state.balance += exec_price * pos.size - fee
                strategy.state.position = None

    def _calculate_equity(self, strategy: Strategy, current_price: Decimal) -> Decimal:
        """
        Calculate current equity = cash + position market value.

        For long: equity = balance + current_price * size
                  (we own shares worth current_price * size)

        For short: equity = balance - current_price * size
                   (balance includes short sale proceeds, but we owe current_price * size to close)
        """
        equity = strategy.state.balance

        if strategy.state.position:
            pos = strategy.state.position
            if pos.side == "long":
                # We own the asset, its value is current market price
                equity += current_price * pos.size
            else:
                # Short: balance already includes entry_price * size from opening the short.
                # To close, we need to buy back at current_price * size.
                # So equity = balance - cost_to_close = balance - current_price * size
                equity -= current_price * pos.size

        return equity

    def _build_statistics(self, strategy: Strategy, equity_series: pd.Series) -> BacktestStatistics:
        """Build backtest statistics from strategy state."""
        trades = strategy.state.trades
        winning = [t for t in trades if t.pnl > 0]
        losing = [t for t in trades if t.pnl <= 0]

        initial = float(strategy.initial_balance)
        final_equity = equity_series.iloc[-1] if len(equity_series) > 0 else initial

        # Total PnL = final equity - initial balance
        total_pnl = Decimal(str(final_equity)) - strategy.initial_balance
        total_return_pct = float(total_pnl / strategy.initial_balance * 100)

        # Calculate max drawdown
        peak = equity_series.expanding().max()
        drawdown = equity_series - peak
        max_dd = abs(drawdown.min()) if len(drawdown) > 0 else 0
        max_dd_pct = (max_dd / peak.max() * 100) if peak.max() > 0 else 0

        # Calculate Sharpe ratio (simplified, assumes daily)
        sharpe = None
        if len(equity_series) > 1:
            returns = equity_series.pct_change().dropna()
            if len(returns) > 0 and returns.std() > 0:
                sharpe = float(returns.mean() / returns.std())

        return BacktestStatistics(
            strategy_name=strategy.__class__.__name__,
            initial_balance=strategy.initial_balance,
            final_equity=Decimal(str(final_equity)),
            total_pnl=total_pnl,
            total_return_pct=total_return_pct,
            total_trades=len(trades),
            winning_trades=len(winning),
            losing_trades=len(losing),
            win_rate=len(winning) / len(trades) if trades else 0.0,
            max_drawdown=Decimal(str(max_dd)),
            max_drawdown_pct=float(max_dd_pct),
            sharpe_ratio=sharpe,
            trades=trades,
            equity_curve=equity_series,
        )

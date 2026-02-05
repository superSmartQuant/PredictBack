"""
Simple momentum strategy.
Buys when price is trending up, sells when trending down.
"""

from decimal import Decimal
import pandas as pd

from app.core.strategy import Strategy, Order


class MomentumStrategy(Strategy):
    """
    Simple momentum strategy.

    Uses a lookback window to determine price trend direction.
    Goes long when price momentum is positive, short when negative.
    """

    def __init__(
        self,
        lookback_window: int = 10,
        momentum_threshold: Decimal = Decimal("0.005"),
        order_size: Decimal = Decimal("100"),
        initial_balance: Decimal = Decimal("10000"),
    ):
        """
        Initialize momentum strategy.

        Args:
            lookback_window: Number of trades to look back for momentum calculation
            momentum_threshold: Minimum momentum to trigger trade (as decimal, 0.005 = 0.5%)
            order_size: Size of each order
            initial_balance: Starting balance
        """
        super().__init__(initial_balance)
        self.lookback_window = lookback_window
        self.momentum_threshold = momentum_threshold
        self.order_size = order_size

    def on_trade(self, trade_data: pd.Series, historical_data: pd.DataFrame) -> list[Order]:
        """
        Process incoming trade and generate orders based on momentum.

        Momentum = (current_price - lookback_price) / lookback_price
        """
        orders = []

        # Need enough historical data for lookback
        if len(historical_data) < self.lookback_window:
            return orders

        current_price = Decimal(str(trade_data["price"]))

        # Get price from lookback_window trades ago (no future data - using historical_data)
        lookback_price = Decimal(str(historical_data.iloc[-self.lookback_window]["price"]))

        # Calculate momentum
        momentum = (current_price - lookback_price) / lookback_price

        # Generate signals
        if momentum > self.momentum_threshold:
            # Positive momentum -> go long
            if self.state.position is None:
                orders.append(
                    Order(
                        side="buy",
                        price=current_price,
                        size=self.order_size,
                        order_type="market",
                    )
                )
            elif self.state.position.side == "short":
                # Close short and go long
                orders.append(
                    Order(
                        side="buy",
                        price=current_price,
                        size=self.order_size,
                        order_type="market",
                    )
                )

        elif momentum < -self.momentum_threshold:
            # Negative momentum -> go short
            if self.state.position is None:
                orders.append(
                    Order(
                        side="sell",
                        price=current_price,
                        size=self.order_size,
                        order_type="market",
                    )
                )
            elif self.state.position.side == "long":
                # Close long and go short
                orders.append(
                    Order(
                        side="sell",
                        price=current_price,
                        size=self.order_size,
                        order_type="market",
                    )
                )

        return orders

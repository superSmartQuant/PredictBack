# Backtester Processor

A backtesting framework for testing trading strategies on historical Polymarket trade data.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Repository    │────▶│   Backtester    │────▶│  BacktestResult │
│  (trade data)   │     │   (processor)   │     │   (metrics)     │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │    Strategy     │
                        │  (your logic)   │
                        └─────────────────┘
```

## Core Components

### 1. Strategy (Base Class)

Location: `strategy.py`

The abstract base class that all strategies must inherit from.

```python
class Strategy(ABC):
    @abstractmethod
    def on_trade(self, trade_data: pd.Series, historical_data: pd.DataFrame) -> list[Order]:
        """Called for each trade. Returns orders to execute."""
        pass
```

**Key Methods:**
- `on_trade()` - Called for each historical trade (MUST implement)
- `on_start()` - Called before backtest starts (optional)
- `on_end()` - Called after backtest ends (optional)
- `reset()` - Resets strategy state for new backtest run

**State Management:**
- `self.state.balance` - Current cash balance
- `self.state.position` - Current open position (or None)
- `self.state.trades` - List of executed trades

### 2. Backtester (Processor)

Location: `backtester.py`

Processes historical data and executes strategy logic.

```python
backtester = Backtester(fee_rate=Decimal("0.001"))
result = backtester.run(strategy, dataframe)
```

**How It Prevents Look-Ahead Bias:**

```python
for i in range(len(df)):
    current_trade = df.iloc[i]

    # CRITICAL: Only data up to current point
    historical_data = df.iloc[:i + 1].copy()

    # Strategy only sees past + current, never future
    orders = strategy.on_trade(current_trade, historical_data)
```

The backtester:
1. Sorts data by timestamp (oldest first)
2. Iterates through each trade chronologically
3. Passes only historical data (up to current trade) to strategy
4. Executes orders at current market price
5. Tracks equity curve throughout

### 3. Data Classes

**Order** - Represents a trade order:
```python
@dataclass
class Order:
    side: str          # "buy" or "sell"
    price: Decimal     # Limit price (ignored for market orders)
    size: Decimal      # Order size
    order_type: str    # "limit" or "market"
```

**Position** - Represents an open position:
```python
@dataclass
class Position:
    side: str              # "long" or "short"
    entry_price: Decimal
    size: Decimal
    entry_time: pd.Timestamp
```

**Trade** - Represents an executed trade:
```python
@dataclass
class Trade:
    side: str
    price: Decimal
    size: Decimal
    timestamp: pd.Timestamp
    pnl: Decimal
```

## Creating a Strategy

### Step 1: Inherit from Strategy

```python
from strategy import Strategy, Order
from decimal import Decimal

class MyStrategy(Strategy):
    def __init__(self, my_param: int = 10):
        super().__init__(initial_balance=Decimal("10000"))
        self.my_param = my_param

    def on_trade(self, trade_data: pd.Series, historical_data: pd.DataFrame) -> list[Order]:
        orders = []

        # Your logic here using ONLY historical_data
        # NEVER access future data

        current_price = Decimal(str(trade_data["price"]))

        if some_condition:
            orders.append(Order(
                side="buy",
                price=current_price,
                size=Decimal("100"),
                order_type="market"
            ))

        return orders
```

### Step 2: Use Historical Data Correctly

```python
def on_trade(self, trade_data: pd.Series, historical_data: pd.DataFrame) -> list[Order]:
    # CORRECT: Use historical_data for calculations
    prices = historical_data["price"].astype(float)
    sma = prices.rolling(window=20).mean().iloc[-1]

    # WRONG: Don't do this - accessing future data
    # future_price = df.iloc[current_index + 10]["price"]

    return orders
```

### Step 3: Run Backtest

```python
from backtester import Backtester

backtester = Backtester(fee_rate=Decimal("0.001"))
result = backtester.run(my_strategy, df)
print(result)
```

## BacktestResult

The result object contains:

| Field | Type | Description |
|-------|------|-------------|
| `strategy_name` | str | Name of the strategy class |
| `initial_balance` | Decimal | Starting balance |
| `final_balance` | Decimal | Ending balance |
| `total_pnl` | Decimal | Total realized profit/loss |
| `total_trades` | int | Number of executed trades |
| `winning_trades` | int | Number of profitable trades |
| `losing_trades` | int | Number of losing trades |
| `win_rate` | float | Percentage of winning trades |
| `max_drawdown` | Decimal | Maximum equity drawdown |
| `sharpe_ratio` | float | Risk-adjusted return metric |
| `trades` | list[Trade] | All executed trades |
| `equity_curve` | pd.Series | Equity over time |

## Included Strategies

### GridStrategy

Trades at fixed price intervals around a base price.

```python
from strategies import GridStrategy

strategy = GridStrategy(
    grid_size=5,           # Number of levels above/below
    grid_spacing=Decimal("0.02"),  # 2% between levels
    order_size=Decimal("100"),
)
```

**Logic:**
- Sets base price on first trade
- Sells when price crosses grid level upward
- Buys when price crosses grid level downward
- Profits from sideways/oscillating markets

### MomentumStrategy

Follows price trends using momentum.

```python
from strategies import MomentumStrategy

strategy = MomentumStrategy(
    lookback_window=20,              # Trades to look back
    momentum_threshold=Decimal("0.01"),  # 1% threshold
    order_size=Decimal("100"),
)
```

**Logic:**
- Calculates momentum = (current - past) / past
- Goes long when momentum > threshold
- Goes short when momentum < -threshold
- Profits from trending markets

## Data Flow

```
1. Load trades from database
   │
   ▼
2. Sort by block_time (ascending)
   │
   ▼
3. For each trade i:
   │
   ├─▶ historical_data = trades[0:i+1]  ← No future data!
   │
   ├─▶ strategy.on_trade(trade, historical_data)
   │
   ├─▶ Execute returned orders
   │
   └─▶ Update equity curve
   │
   ▼
4. Calculate final metrics
   │
   ▼
5. Return BacktestResult
```

## Best Practices

1. **Never access future data** - Only use `historical_data` parameter
2. **Use Decimal for prices** - Avoid floating point errors
3. **Reset state properly** - Override `on_start()` if you have custom state
4. **Test with small data first** - Verify logic before full backtest
5. **Check for sufficient data** - Guard against index errors in lookback calculations

```python
def on_trade(self, trade_data, historical_data):
    # Guard against insufficient data
    if len(historical_data) < self.lookback_window:
        return []

    # Safe to proceed...
```

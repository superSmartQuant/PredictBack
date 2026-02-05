"""
Example script to test the Backtester API.
"""

import requests

BASE_URL = "http://localhost:8000/api/v1"


def test_health():
    """Test health endpoint."""
    response = requests.get(f"{BASE_URL}/health")
    print("=== Health Check ===")
    print(response.json())
    print()


def get_topics():
    """Get all topics."""
    response = requests.get(f"{BASE_URL}/topics/")
    print("=== Topics ===")
    if response.status_code == 200:
        data = response.json()
        print(f"Found {data['count']} topics:")
        for topic in data["topics"]:
            print(f"  - {topic['name']} (continuous: {topic['continuous']})")
    else:
        print(f"Error: {response.status_code}")
        print(response.json())
    print()
    return response


def get_markets(topic: str = None):
    """Get markets, optionally filtered by topic."""
    params = {"topic": topic} if topic else {}
    response = requests.get(f"{BASE_URL}/topics/markets", params=params)
    print(f"=== Markets {f'(topic: {topic})' if topic else '(all)'} ===")
    if response.status_code == 200:
        data = response.json()
        print(f"Found {data['count']} markets:")
        for market in data["markets"][:5]:  # Show first 5
            print(f"  - {market['clob_token_id'][:20]}... ({market['topic']})")
            print(market["question"])
        if data["count"] > 5:
            print(f"  ... and {data['count'] - 5} more")
    else:
        print(f"Error: {response.status_code}")
        print(response.json())
    print()
    return response


def run_grid_backtest(clob_token_id: str):
    """Run backtest with Grid strategy."""
    payload = {
        "clob_token_id": clob_token_id,
        "strategy": {
            "strategy_type": "grid",
            "grid_size": 5,
            "grid_spacing": "0.02",
            "order_size": "100",
            "initial_balance": "10000"
        },
        "fee_rate": "0.001"
    }

    print("=== Grid Strategy Backtest ===")
    response = requests.post(f"{BASE_URL}/backtest/run", json=payload)

    if response.status_code == 200:
        result = response.json()
        stats = result["statistics"]
        print(f"Strategy: {stats['strategy_name']}")
        print(f"Initial Balance: {stats['initial_balance']}")
        print(f"Final Equity: {stats['final_equity']}")
        print(f"Total PnL: {stats['total_pnl']} ({stats['total_return_pct']:.2f}%)")
        print(f"Total Trades: {stats['total_trades']}")
        print(f"Win Rate: {stats['win_rate'] * 100:.2f}%")
        print(f"Max Drawdown: {stats['max_drawdown']} ({stats['max_drawdown_pct']:.2f}%)")
        print(f"Dataframe rows: {result['row_count']}")
        print("aaaaa",result["dataframe"][0].keys())
        exit(0)
    else:
        print(f"Error: {response.status_code}")
        print(response.json())
    print()
    return response


def run_momentum_backtest(clob_token_id: str):
    """Run backtest with Momentum strategy."""
    payload = {
        "clob_token_id": clob_token_id,
        "strategy": {
            "strategy_type": "momentum",
            "lookback_window": 10,
            "momentum_threshold": "0.005",
            "order_size": "100",
            "initial_balance": "10000"
        },
        "fee_rate": "0.001"
    }

    print("=== Momentum Strategy Backtest ===")
    response = requests.post(f"{BASE_URL}/backtest/run", json=payload)

    if response.status_code == 200:
        result = response.json()
        stats = result["statistics"]
        print(f"Strategy: {stats['strategy_name']}")
        print(f"Initial Balance: {stats['initial_balance']}")
        print(f"Final Equity: {stats['final_equity']}")
        print(f"Total PnL: {stats['total_pnl']} ({stats['total_return_pct']:.2f}%)")
        print(f"Total Trades: {stats['total_trades']}")
        print(f"Win Rate: {stats['win_rate'] * 100:.2f}%")
        print(f"Max Drawdown: {stats['max_drawdown']} ({stats['max_drawdown_pct']:.2f}%)")
        print(f"Dataframe rows: {result['row_count']}")
    else:
        print(f"Error: {response.status_code}")
        print(response.json())
    print()
    return response


def run_custom_backtest(clob_token_id: str):
    """
    Run backtest with Custom strategy using configurable indicators.

    This example implements a classic EMA crossover + RSI filter strategy:
    - Buy when fast EMA > slow EMA AND RSI < 70 (not overbought)
    - Sell when fast EMA < slow EMA AND RSI > 30 (not oversold)
    """
    payload = {
        "clob_token_id": clob_token_id,
        "strategy": {
            "strategy_type": "custom",
            "indicators": [
                {"type": "ema", "name": "fast_ema", "period": 12},
                {"type": "ema", "name": "slow_ema", "period": 26},
                {"type": "rsi", "name": "rsi", "period": 14},
                {"type": "bollinger", "name": "bb", "period": 20, "num_std": 2},
            ],
            "buy_rules": [
                # Rule 1: EMA crossover with RSI filter
                {
                    "conditions": [
                        {"indicator": "fast_ema", "operator": ">", "compare_to_indicator": "slow_ema"},
                        {"indicator": "rsi", "operator": "<", "value": 70}
                    ],
                    "description": "EMA bullish crossover with RSI not overbought"
                },
            ],
            "sell_rules": [
                # Rule 1: EMA crossover with RSI filter
                {
                    "conditions": [
                        {"indicator": "fast_ema", "operator": "<", "compare_to_indicator": "slow_ema"},
                        {"indicator": "rsi", "operator": ">", "value": 30}
                    ],
                    "description": "EMA bearish crossover with RSI not oversold"
                },
            ],
            "order_size": "100",
            "initial_balance": "10000"
        },
        "fee_rate": "0.001"
    }

    print("=== Custom Strategy Backtest (EMA Crossover + RSI) ===")
    response = requests.post(f"{BASE_URL}/backtest/run", json=payload)

    if response.status_code == 200:
        result = response.json()
        stats = result["statistics"]
        print(f"Strategy: {stats['strategy_name']}")
        print(f"Initial Balance: {stats['initial_balance']}")
        print(f"Final Equity: {stats['final_equity']}")
        print(f"Total PnL: {stats['total_pnl']} ({stats['total_return_pct']:.2f}%)")
        print(f"Total Trades: {stats['total_trades']}")
        print(f"Win Rate: {stats['win_rate'] * 100:.2f}%")
        print(f"Max Drawdown: {stats['max_drawdown']} ({stats['max_drawdown_pct']:.2f}%)")
        print(f"Dataframe rows: {result['row_count']}")
    else:
        print(f"Error: {response.status_code}")
        print(response.json())
    print()
    return response


if __name__ == "__main__":
    # Test health endpoint
    test_health()

    # Get topics and markets
    get_topics()
    get_markets()

    # Replace with a valid clob_token_id from your database
    CLOB_TOKEN_ID = "42136182392275386068782686833726153478146480127191420261503042855023722001012"

    print(f"Using market: {CLOB_TOKEN_ID}\n")

    # Run all strategies
    run_grid_backtest(CLOB_TOKEN_ID)
    run_momentum_backtest(CLOB_TOKEN_ID)
    run_custom_backtest(CLOB_TOKEN_ID)

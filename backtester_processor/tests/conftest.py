"""
Pytest configuration and fixtures.
"""

import pytest
from datetime import datetime, timedelta
from decimal import Decimal

import pandas as pd


@pytest.fixture
def mock_trades():
    """Create mock trade data for testing."""
    def _create_trades(
        prices: list[float],
        start_time: datetime = datetime(2024, 1, 1, 12, 0, 0),
        interval_seconds: int = 60,
    ) -> pd.DataFrame:
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
    return _create_trades

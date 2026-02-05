"""
Data utilities for the backtester.
"""

import pandas as pd


def format_trades(trades: list[dict]) -> pd.DataFrame:
    """
    Format raw trades into a DataFrame ready for backtesting.

    Args:
        trades: List of trade dictionaries from the repository

    Returns:
        DataFrame sorted by block_time with price column
    """
    df = pd.DataFrame(trades)
    df.sort_values(by="block_time", inplace=True)
    df.reset_index(drop=True, inplace=True)

    # Use stored price from database if available and valid
    # Only calculate from amounts as fallback (e.g., for legacy data)
    if "price" not in df.columns or df["price"].isna().all():
        df["price"] = df["taker_amount_filled"] / df["maker_amount_filled"]

    return df

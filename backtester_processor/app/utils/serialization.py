"""
Serialization utilities for JSON-safe conversion of DataFrames and Decimals.
"""

from decimal import Decimal
from typing import Any
import pandas as pd
import numpy as np


def decimal_to_str(value: Decimal) -> str:
    """Convert Decimal to string for JSON serialization."""
    return str(value)


def serialize_dataframe(df: pd.DataFrame) -> list[dict[str, Any]]:
    """
    Serialize DataFrame to list of dictionaries with JSON-safe types.

    Handles:
    - Decimal -> str
    - pd.Timestamp -> ISO string
    - np.int64/float64 -> Python int/float
    - NaN -> None
    """
    result = []

    for _, row in df.iterrows():
        row_dict = {}
        for col, value in row.items():
            row_dict[col] = _serialize_value(value)
        result.append(row_dict)

    return result


def _serialize_value(value: Any) -> Any:
    """Convert a single value to JSON-serializable type."""
    if pd.isna(value):
        return None
    elif isinstance(value, Decimal):
        return str(value)
    elif isinstance(value, pd.Timestamp):
        return value.isoformat()
    elif isinstance(value, (np.integer,)):
        return int(value)
    elif isinstance(value, (np.floating,)):
        return float(value)
    elif isinstance(value, np.ndarray):
        return value.tolist()
    else:
        return value

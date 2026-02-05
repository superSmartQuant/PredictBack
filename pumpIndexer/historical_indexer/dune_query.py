"""
Query Polymarket OrderFilled events from Dune Analytics.

Usage:
    export DUNE_API_KEY="your_api_key_here"
    python dune_query.py ctf [maker_asset_id]
    python dune_query.py neg [maker_asset_id]
"""

import os
import sys
import pandas as pd
from dotenv import load_dotenv
from dune_client.client import DuneClient

load_dotenv()


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize Dune column names to snake_case."""
    column_map = {
        "evt_tx_hash": "tx_hash",
        "evt_block_number": "block_number",
        "evt_block_time": "block_time",
        "makerAssetId": "maker_asset_id",
        "takerAssetId": "taker_asset_id",
        "makerAmountFilled": "maker_amount_filled",
        "takerAmountFilled": "taker_amount_filled",
    }
    return df.rename(columns=column_map)


def query_ctf(dune: DuneClient, maker_asset_id: str) -> pd.DataFrame:
    """Query CTFExchange OrderFilled events."""
    query_sql = f"""
SELECT evt_tx_hash, evt_block_number, evt_block_time,
       makerAssetId, takerAssetId, makerAmountFilled, takerAmountFilled
FROM polymarket_polygon.ctfexchange_evt_orderfilled
WHERE makerAssetId = CAST('{maker_asset_id}' AS uint256)
ORDER BY evt_index
LIMIT 10000
"""
    print(f"Querying CTFExchange for maker_asset_id: {maker_asset_id[:20]}...")
    result = dune.run_sql(query_sql=query_sql, is_private=False)
    df = pd.DataFrame(result.result.rows)
    return normalize_columns(df)


def query_neg(dune: DuneClient, maker_asset_id: str) -> pd.DataFrame:
    """Query NegRiskCTFExchange OrderFilled events."""
    query_sql = f"""
SELECT evt_tx_hash, evt_block_number, evt_block_time,
       makerAssetId, takerAssetId, makerAmountFilled, takerAmountFilled
FROM polymarket_polygon.negriskctfexchange_evt_orderfilled
WHERE makerAssetId = CAST('{maker_asset_id}' AS uint256)
ORDER BY evt_index
LIMIT 10000
"""
    print(f"Querying NegRiskCTFExchange for maker_asset_id: {maker_asset_id[:20]}...")
    result = dune.run_sql(query_sql=query_sql, is_private=False)
    df = pd.DataFrame(result.result.rows)
    return normalize_columns(df)


def main():
    api_key = os.environ.get("DUNE_API_KEY")

    DEFAULT_MAKER_ASSET_ID = "22103094389913052942362639589409218272323168761614999702665821259175535456835"
    NORMAL_CFT_ID="56366625327209916497048389779270677325190285271579363742680171410066242186791"

    dune = DuneClient(api_key)

    df = query_neg(dune, DEFAULT_MAKER_ASSET_ID)
    df_normal = query_ctf(dune, NORMAL_CFT_ID)

    print(f"\nFound {len(df)} orders")
    print(df)
    print(f"\nFound {len(df_normal)} orders")
    print(df_normal)
    return df

if __name__ == "__main__":
    main()

"""
Main entry point for indexing Polymarket markets into PostgreSQL.

Configure the market in main() and run:
    python main.py
"""

import sys
import json
from db.repository import PolymarketRepository, get_table_name


def add_market(repo: PolymarketRepository, clob_token_id: str, question: str, slug: str = None, neg: bool = False, topic: str = None):
    """Add a new market to be indexed."""
    if repo.market_exists(clob_token_id):
        print(f"Market already exists: {clob_token_id[:20]}...")
        return

    table_name = repo.add_market(clob_token_id, question, slug, neg, topic)
    print(f"Added market: {clob_token_id[:20]}...")
    print(f"Table created: {table_name}")


def list_markets(repo: PolymarketRepository):
    """List all indexed markets."""
    markets = repo.get_indexed_markets()

    if not markets:
        print("No markets indexed yet.")
        return

    print(f"\n{'='*120}")
    print(f"{'CLOB Token ID':<25} {'Question':<40} {'Topic':<15} {'Neg':<6} {'Trades'}")
    print(f"{'='*120}")

    for market in markets:
        clob_id = market["clob_token_id"][:20] + "..."
        question = (market["question"] or "-")[:37] + "..." if len(market.get("question") or "") > 40 else (market.get("question") or "-")
        topic = market["topic"] or "-"
        neg = "Yes" if market["neg"] else "No"

        try:
            trade_count = repo.get_trade_count(market["clob_token_id"])
        except Exception:
            trade_count = 0

        print(f"{clob_id:<25} {question:<40} {topic:<15} {neg:<6} {trade_count}")

    print(f"{'='*120}\n")


def index_market(repo: PolymarketRepository, clob_token_id: str, neg_risk: bool):
    """
    Index trades for a specific market.
    """
    from historical_indexer.dune_query import query_neg, query_ctf
    from dune_client.client import DuneClient
    import os

    if not repo.market_exists(clob_token_id):
        print(f"Error: Market not registered. Use add_market() first with the question field.")
        sys.exit(1)

    api_key = os.environ.get("DUNE_API_KEY")
    if not api_key:
        print("Error: DUNE_API_KEY not set")
        sys.exit(1)

    dune = DuneClient(api_key)

    print(f"Fetching trades for {clob_token_id[:20]}...")

    if neg_risk:
        df = query_neg(dune, clob_token_id)
    else:
        df = query_ctf(dune, clob_token_id)

    if df.empty:
        print("No trades found.")
        return

    # Debug: print columns and first row
    print(f"Columns: {df.columns.tolist()}")
    print(f"First row: {df.iloc[0].to_dict()}")

    trades = df.to_dict("records")
    inserted = repo.insert_trades(clob_token_id, trades)

    print(f"Inserted {inserted} trades into {get_table_name(clob_token_id)}")


def main():
    repo = PolymarketRepository()
    market = {
  "slug": "will-donald-trump-win-the-2024-us-presidential-election",
  "clob_token_id": "21742633143463906290569050155826241533067272736897614950488156847949938836455",
  "negRisk": True,
  "category": "election",
  "question": "Will Donald Trump win the 2024 US Presidential Election?",
  "groupItemTitle": "Donald Trump"
}
    add_market(repo, market["clob_token_id"], market["question"], market["slug"], market["negRisk"], market["category"])
    list_markets(repo)
    index_market(repo, market["clob_token_id"], market["negRisk"])

    if False==True:
        with open("markets_btc_updown.json", "r") as f:
            markets = json.load(f)
        for market in markets:
            add_market(repo, market["clob_token_id"], market["question"], market["slug"], market["negRisk"], market["category"])
            list_markets(repo)
            index_market(repo, market["clob_token_id"], market["negRisk"])


if __name__ == "__main__":
    main()

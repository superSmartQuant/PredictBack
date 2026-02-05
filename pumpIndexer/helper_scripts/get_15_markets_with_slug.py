import requests
import sys
import json

def get_market_by_slug(slug: str):
    """Fetch a market by its slug from the Polymarket API."""
    url = "https://gamma-api.polymarket.com/markets"
    response = requests.get(url, params={"slug": slug})

    if response.status_code == 200:
        data = response.json()
        return data[0] if data else None
    else:
        print(f"Error: {response.status_code}")
        return None

def main():
    markets = []
    id=1770111000
    for i in range(1, 20):
        id=id-900
        slug = f"btc-updown-15m-{id}"
        market = get_market_by_slug(slug)

        if market:
            print(f"\nMarket: {market.get('question', 'N/A')}")
            print(f"Slug: {market.get('slug', 'N/A')}")
            print(f"Neg: {market.get('negRisk', 'N/A')}")
            category = "btc-updown-15m"
            clob_token_id = json.loads(market.get('clobTokenIds', 'N/A'))[0]
            filtered_market = {
                "slug": market.get('slug', 'N/A'),
                "clob_token_id": clob_token_id,
                "negRisk": market.get('negRisk', 'N/A'),
                "category": category,
                "question": market.get('question', 'N/A'),

            }
            markets.append(filtered_market)
        #write json
    with open(f"markets_btc_updown.json", "w") as f:
        json.dump(markets, f)
if __name__ == "__main__":
    main()

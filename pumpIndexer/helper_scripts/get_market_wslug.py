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

def get_event_by_slug(slug: str):
    """Fetch an event (with nested markets) by its slug from the Polymarket API."""
    url = "https://gamma-api.polymarket.com/events"
    response = requests.get(url, params={"slug": slug})

    if response.status_code == 200:
        data = response.json()
        return data[0] if data else None
    else:
        print(f"Error: {response.status_code}")
        return None

def get_candidate_market(event_slug: str, candidate_name: str):
    """Get a specific candidate's market from an event."""
    event = get_event_by_slug(event_slug)
    if not event:
        return None

    markets = event.get('markets', [])
    for market in markets:
        question = market.get('question', '').lower()
        group_title = market.get('groupItemTitle', '').lower()
        if candidate_name.lower() in question or candidate_name.lower() in group_title:
            return market
    return None

def main():
    event_slug = "presidential-election-winner-2024"
    candidate = "Donald Trump"

    market = get_candidate_market(event_slug, candidate)

    if market:
        print(f"\nMarket: {market.get('question', 'N/A')}")
        print(f"Slug: {market.get('slug', 'N/A')}")
        print(f"Neg Risk: {market.get('negRisk', 'N/A')}")
        print(f"Group Title: {market.get('groupItemTitle', 'N/A')}")

        category = "election"
        clob_token_ids = json.loads(market.get('clobTokenIds', '[]'))
        clob_token_id = clob_token_ids[0] if clob_token_ids else None

        filtered_market = {
            "slug": market.get('slug', 'N/A'),
            "clob_token_id": clob_token_id,
            "negRisk": market.get('negRisk', 'N/A'),
            "category": category,
            "question": market.get('question', 'N/A'),
            "groupItemTitle": market.get('groupItemTitle', 'N/A'),
        }
        print(json.dumps(filtered_market, indent=2))
    else:
        print(f"No market found for {candidate} in event {event_slug}")

if __name__ == "__main__":
    main()

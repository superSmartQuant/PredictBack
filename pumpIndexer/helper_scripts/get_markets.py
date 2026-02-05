import requests

# Fetch multiple markets by clobTokenId
clob_token_ids = [
    "22103094389913052942362639589409218272323168761614999702665821259175535456835",
    #"21296624965887450804742516563526632324551397901259017139941826024484477821625"
]

# Try the CLOB markets endpoint with token ID filter
url = "https://gamma-api.polymarket.com/markets"
# Pass as list - requests will use repeated parameters (?clob_token_ids=x&clob_token_ids=y)
params = [("clob_token_ids", tid) for tid in clob_token_ids]

response = requests.get(url, params=params)
data = response.json()

if isinstance(data, list) and len(data) > 0:
    print(f"\nFetched {len(data)} market(s):\n")
    for idx, market in enumerate(data, 1):
            print(market)
            filtered_market = {
                "slug": market.get('slug', 'N/A'),
                "clob_token_id": "22103094389913052942362639589409218272323168761614999702665821259175535456835",
                "negRisk": market.get('negRisk', 'N/A'),
                "category": "election",
                "question": market.get('question', 'N/A'),
            }
            print(filtered_market)

# Polymarket Indexer

Index Polymarket historical trades into PostgreSQL.

## VPS Setup

### 1. Install PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Install Python 3.11+

```bash
sudo apt install python3 python3-pip python3-venv -y
```

### 3. Clone and Setup Project

```bash
cd /opt
git clone <your-repo-url> pumpIndexer
cd pumpIndexer

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 4. Setup Database

```bash
# Run the setup script
chmod +x db/setup_db.sh
./db/setup_db.sh

# Or manually:
sudo -u postgres psql -c "CREATE DATABASE polymarket_db;"
sudo -u postgres psql -d polymarket_db -f db/init.sql
```

### 5. Configure Environment

```bash
cp .env.example .env
nano .env
```

Add your credentials:
```
DUNE_API_KEY=your_dune_api_key
DATABASE_URL=postgresql://polymarket_user:polymarket_pass@localhost:5432/polymarket_db
```

### 6. Run

```bash
source venv/bin/activate
python main.py
```

## Configuration

Edit `main.py` to configure the market:

```python
def main():
    clob_token_id = "22103094389913..."  # Your market's CLOB token ID
    slug = "market-name"                  # Market slug for reference
    neg = True                            # True for NegRisk, False for CTF
```

## Database Schema

### hist_markets
| Column | Type |
|--------|------|
| clob_token_id | VARCHAR(100) PK |
| market_slug | VARCHAR(255) |
| neg | BOOLEAN |

### hist_trades_{first_15_chars}
| Column | Type |
|--------|------|
| tx_hash | VARCHAR(66) |
| block_number | BIGINT |
| block_time | TIMESTAMP |
| maker | VARCHAR(42) |
| taker | VARCHAR(42) |
| maker_amount_filled | NUMERIC |
| taker_amount_filled | NUMERIC |
| price | NUMERIC |

## Useful Commands

```bash
# Connect to database
psql -U polymarket_user -d polymarket_db

# List indexed markets
SELECT * FROM hist_markets;

# Check trade count for a market
SELECT COUNT(*) FROM hist_trades_221030943899130;

# View recent trades
SELECT * FROM hist_trades_221030943899130 ORDER BY block_time DESC LIMIT 10;
```

-- Create the polymarket_db database
-- Run: psql -U polymarket_user -d polymarket_db -f init.sql

-- Table to store all valid topics
CREATE TABLE IF NOT EXISTS topics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    continuous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster topic lookups
CREATE INDEX IF NOT EXISTS idx_topics_name ON topics(name);

-- Table to track which markets are being indexed
CREATE TABLE IF NOT EXISTS hist_markets (
    clob_token_id VARCHAR(100) PRIMARY KEY,
    market_slug VARCHAR(255),
    question TEXT NOT NULL,
    neg BOOLEAN DEFAULT FALSE,
    topic_id INTEGER REFERENCES topics(id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_market_slug ON hist_markets(market_slug);
CREATE INDEX IF NOT EXISTS idx_market_topic ON hist_markets(topic_id);

-- Function to create a hist_trades table for a specific market
-- Table name format: hist_trades_{first_15_chars_of_clob_id}
CREATE OR REPLACE FUNCTION create_hist_trades_table(table_suffix VARCHAR(15))
RETURNS VOID AS $$
DECLARE
    table_name TEXT;
BEGIN
    table_name := 'hist_trades_' || table_suffix;

    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I (
            id SERIAL PRIMARY KEY,
            tx_hash VARCHAR(66) NOT NULL,
            block_number BIGINT,
            block_time TIMESTAMP,
            maker VARCHAR(42),
            taker VARCHAR(42),
            maker_asset_id VARCHAR(100),
            taker_asset_id VARCHAR(100),
            maker_amount_filled NUMERIC(78, 0),
            taker_amount_filled NUMERIC(78, 0),
            fee NUMERIC(78, 0),
            side VARCHAR(10),
            price NUMERIC(20, 10),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(tx_hash, maker, taker, maker_amount_filled)
        )', table_name);

    -- Create indexes for the new table
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_block_time ON %I(block_time)', table_suffix, table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_maker ON %I(maker)', table_suffix, table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_taker ON %I(taker)', table_suffix, table_name);
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust user as needed)
-- GRANT ALL PRIVILEGES ON DATABASE polymarket_db TO your_user;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;

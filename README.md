I chose Market Order for the implementation (reason in README below) and built a mock DEX router (Raydium + Meteora) with realistic delays, price variance, routing, WebSocket status flow (on the same HTTP → WebSocket connection), BullMQ queue with concurrency/throughput rules, exponential-backoff retries, and PostgreSQL + Redis persistence hooks.



I implemented Market Orders because they provide deterministic execution immediately against the best quoted price and let the engine demonstrate routing, slippage protection, retries, and full lifecycle streaming without needing price-watch background processes. The same engine can be extended to support Limit Orders by adding a price-watch service that enqueues execution once the market reaches the target price, and Sniper Orders by adding a low-latency monitoring component that triggers execution upon token-launch events.

pg + knex for simple queries (no heavy ORM) to keep code short


TABLE PSQL - enter in cli after running:

psql -U postgres -d order_exec_engine

**************************************
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  token_in TEXT,
  token_out TEXT,
  amount_in NUMERIC,
  min_amount_out NUMERIC,
  type TEXT,
  status TEXT,
  tx_hash TEXT,
  executed_price NUMERIC,
  attempts INT DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);


_________________________________________________________

How to extend to Limit and Sniper 

Limit Orders: maintain a price-watcher background worker which periodically queries quotes and enqueues the order once the quoted execution price meets the limit condition. This watcher can be implemented as a time-series or websocket feed to avoid polling if you integrate a market data provider.

Sniper Orders: add a specialized low-latency monitor for new pair/pool events (e.g., watch chain events or mempool for pair creation). When launch event detected, immediately enqueue a market/swap job with higher priority, low slippage tolerance, and optionally multiple parallel attempts to increase chance of fill.
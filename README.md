# Order Execution Engine

This repository implements an order execution backend that processes **Market Orders** with DEX routing and WebSocket status streaming. The implementation uses a mock DEX router (Raydium and Meteora) to simulate realistic delays and price variance while focusing on architecture, routing logic, and lifecycle streaming.

## Key Features

- Market Order execution flow (single order type).
- DEX routing between a mocked Raydium and Meteora router.
- WebSocket streaming of lifecycle events (`pending`, `routing`, `building`, `submitted`, `confirmed`, `failed`).
- BullMQ-backed job queue with concurrency control and exponential backoff retries.
- PostgreSQL for persistent order history.
- Redis for BullMQ (job store / backend).
- Fastify HTTP server with a WebSocket upgrade route.
- Minimal static browser client at `/static/client.html` for live monitoring.

## Why Market Orders

Market Orders are chosen because they execute immediately against available quotes, enabling a focused demonstration of routing, slippage protection, retry/backoff logic, and a real-time lifecycle stream. Extending the engine to support Limit or Sniper orders requires additional trigger/monitoring services but not changes to the core execution worker.

### How to extend
- **Limit orders**: Add a price-watcher service that checks current quotes and enqueues execution when the target price is met.
- **Sniper orders**: Add a low-latency launch-monitor that enqueues a market order when a new pair/pool event is detected on-chain.

## Architecture Overview

1. **HTTP → WebSocket Flow**
   - Client posts `POST /api/orders/execute` with order payload.
   - Server returns `{ status: 'queued', orderId, ws_url }`.
   - Client connects to `ws://<host>/api/orders/upgrade/:orderId`.
   - Server polls the `orders` DB row for changes and pushes updates to the socket.

2. **Mock DEX Router**
   - Simulates network delays, price variation and an execution delay of 2–3s.
   - Returns quote objects `{ dex, price, fee }` and a simulated execution `{ txHash, executedPrice }`.

3. **Worker / Queue**
   - Worker consumes `orderQueue` jobs, fetches both DEX quotes concurrently, chooses the best net price (price - fee), checks slippage (if `minAmountOut` provided), and then executes a simulated swap.
   - Lifecycle states are persisted to Postgres on each transition.

4. **Storage**
   - Postgres `orders` table contains order lifecycle history and final execution data.
   - Redis is used by BullMQ for the queue backend.

## Minimal Postgres schema

Run in a psql prompt (example):

```sql
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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

# Order Execution Engine

This project implements a market-order execution backend with DEX routing, a BullMQ worker, PostgreSQL persistence, and a WebSocket status stream. The system is structured around a single entrypoint for creating an order and a dedicated WebSocket upgrade route for monitoring its lifecycle.

The design matches the assignment requirement:
- A POST endpoint enqueues the order and returns its `orderId`.
- The client upgrades to a WebSocket connection tied to that `orderId`.
- The server streams lifecycle updates until the order reaches a terminal state.

## Features

- Market Order execution
- DEX routing between a mocked Raydium and Meteora router
- Order lifecycle streaming over WebSocket
- BullMQ queue with retry, backoff, and concurrency
- PostgreSQL persistence for each lifecycle transition
- Redis-backed queue storage
- Fastify-based HTTP + WebSocket server
- Minimal static HTML client to submit orders and watch updates

---

# Running the System Locally

The system depends on **PostgreSQL** (for order persistence) and **Redis** (for BullMQ queue).

### 1. Start PostgreSQL
Create a database:

```bash
createdb order_exec_engine


# Components Overview
## Fastify Server

Handles REST API

Handles WebSocket upgrades

Polls DB and pushes updates to WebSocket clients

Serves static client files

## MockDexRouter

Simulates:

Realistic network latency

Price variance between Raydium and Meteora

Execution delay

A mock transaction hash

## Worker (BullMQ)

Concurrent processing (concurrency: 10)

Exponential backoff retries

Writes lifecycle transitions to PostgreSQL

## WebSocket Manager

Tracks which client socket belongs to which orderId.
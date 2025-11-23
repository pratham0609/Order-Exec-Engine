// src/server.ts
// Ensure websocket plugin is registered before importing other modules that may use it.

import Fastify from "fastify";
import websocket from "@fastify/websocket";

const fastify = Fastify({ logger: true });

// Register websocket plugin first
await fastify.register(websocket);

// Now safe to import rest
import fastifyStatic from "@fastify/static";
import path from "path";
import { fileURLToPath } from "url";
import { enqueueOrder } from "./producer.js";
import { registerSocket, unregisterSocket, sendStatus } from "./websocketManager.js";
import { db } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// POST /api/orders/execute — enqueue and return ws_url
fastify.post("/api/orders/execute", async (req, reply) => {
  const order = await enqueueOrder(req.body as any);
  return reply.send({
    status: "queued",
    orderId: order.id,
    ws_url: `/api/orders/upgrade/${order.id}`,
  });
});

// WebSocket upgrade route — client connects and we poll DB for status changes
fastify.get(
  "/api/orders/upgrade/:orderId",
  { websocket: true },
  (connection, req) => {
    const params = req.params as { orderId?: string } | unknown;
    const orderId = (params as any)?.orderId as string | undefined;

    if (!orderId) {
      fastify.log.warn("WS upgrade missing orderId");
      connection.socket.close();
      return;
    }

    fastify.log.info(`WS UPGRADE CONNECT: ${orderId}`);
    registerSocket(orderId, connection.socket);

    // We'll poll the DB for this order periodically and send updates when changed.
    // Start by sending the current DB row (if any), then poll for changes.
    let lastSent: string | null = null; // we'll stringify the payload and compare

    let stopped = false;

    const closeHandler = () => {
      if (!stopped) {
        stopped = true;
        unregisterSocket(orderId);
        clearInterval(interval);
        fastify.log.info(`WS UPGRADE CLOSED: ${orderId}`);
      }
    };

    connection.socket.on("close", closeHandler);
    connection.socket.on("error", (err) => {
      fastify.log.warn(`WS socket error for ${orderId}: ${err}`);
      closeHandler();
    });

    // helper to read db and send if changed
    const pollAndSend = async () => {
      try {
        const res = await db.query(
          `SELECT status, tx_hash, executed_price, last_error, attempts, updated_at
           FROM orders WHERE id = $1 LIMIT 1`,
          [orderId]
        );

        let payload: any;

        if (res.rowCount === 0) {
          // No DB row yet — report "pending" as a best-effort
          payload = { status: "pending", orderId };
        } else {
          const r = res.rows[0];
          payload = {
            status: r.status,
            orderId,
            txHash: r.tx_hash ?? null,
            executedPrice: r.executed_price ?? null,
            lastError: r.last_error ?? null,
            attempts: r.attempts ?? null,
            updatedAt: r.updated_at ?? null,
          };
        }

        const payloadStr = JSON.stringify(payload);
        if (payloadStr !== lastSent) {
          lastSent = payloadStr;
          // prefer the helper in websocketManager
          sendStatus(orderId, payload);
          fastify.log.info(`WS POLL -> sent status for ${orderId}: ${payload.status}`);
        }
      } catch (err) {
        fastify.log.error("Error polling DB for order " + orderId + ": " + err);
      }
    };

    // immediate first poll
    void pollAndSend();

    // then poll every 400ms (tweakable). Stop polling after a terminal state (confirmed/failed).
    const interval = setInterval(async () => {
      if (stopped) return;
      await pollAndSend();

      // If lastSent is a terminal state, we can stop polling and close the socket gracefully.
      if (lastSent) {
        try {
          const parsed = JSON.parse(lastSent);
          if (parsed.status === "confirmed" || parsed.status === "failed" || parsed.status === "slippage_failed") {
            // let the client decide; but we will stop polling
            clearInterval(interval);
            // do NOT close socket automatically — let client remain connected if desired
          }
        } catch (e) {
          // ignore parse errors
        }
      }
    }, 400);
  }
);

// Static client serving (after WS routes)
await fastify.register(fastifyStatic, {
  root: path.join(__dirname, "..", "static"),
  prefix: "/static/",
});

// Start server
fastify.listen({ port: 3000, host: "0.0.0.0" }).then(() => {
  console.log("Server running on port 3000");
});

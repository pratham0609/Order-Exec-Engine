// src/server.ts
import Fastify from "fastify";
import websocket from "@fastify/websocket";
import fastifyStatic from "@fastify/static";
import * as path from "path";
import { fileURLToPath } from "url";
import { enqueueOrder } from "./producer.js";
import { registerSocket, unregisterSocket, sendStatus, } from "./websocketManager.js";
import { db } from "./db.js";
// --------------------------
// Resolve __dirname safely
// --------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// --------------------------
// Factory function for tests
// --------------------------
export async function buildServer() {
    const fastify = Fastify({ logger: false });
    // Register WS without top-level await
    await fastify.register(websocket);
    // Static serving
    await fastify.register(fastifyStatic, {
        root: path.join(__dirname, "..", "static"),
        prefix: "/static/",
    });
    // --------------------------
    // Routes
    // --------------------------
    fastify.post("/api/orders/execute", async (req, reply) => {
        const order = await enqueueOrder(req.body);
        return reply.send({
            status: "queued",
            orderId: order.id,
            ws_url: `/api/orders/upgrade/${order.id}`,
        });
    });
    fastify.get("/api/orders/upgrade/:orderId", { websocket: true }, (connection, req) => {
        const { orderId } = req.params;
        if (!orderId) {
            connection.socket.close();
            return;
        }
        registerSocket(orderId, connection.socket);
        let stopped = false;
        let lastSent = null;
        const closeHandler = () => {
            if (!stopped) {
                stopped = true;
                unregisterSocket(orderId);
                clearInterval(interval);
            }
        };
        connection.socket.on("close", closeHandler);
        connection.socket.on("error", closeHandler);
        const pollAndSend = async () => {
            try {
                const res = await db.query(`SELECT status, tx_hash, executed_price, last_error, attempts, updated_at
             FROM orders WHERE id = $1 LIMIT 1`, [orderId]);
                let payload;
                if (res.rowCount === 0) {
                    payload = { status: "pending", orderId };
                }
                else {
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
                    sendStatus(orderId, payload);
                }
            }
            catch (err) { }
        };
        void pollAndSend();
        const interval = setInterval(async () => {
            if (stopped)
                return;
            await pollAndSend();
            if (lastSent) {
                const parsed = JSON.parse(lastSent);
                if (parsed.status === "confirmed" ||
                    parsed.status === "failed" ||
                    parsed.status === "slippage_failed") {
                    clearInterval(interval);
                }
            }
        }, 400);
    });
    return fastify;
}
// --------------------------
// Export a default instance for normal usage
// --------------------------
const server = await buildServer();
export default server;
// --------------------------
// Start server only when run directly
// --------------------------
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    server
        .listen({ port: 3000, host: "0.0.0.0" })
        .then(() => console.log("Server running on port 3000"))
        .catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

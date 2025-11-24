// src/server.ts
import Fastify from "fastify";
import websocket from "@fastify/websocket";
import fastifyStatic from "@fastify/static";
import * as path from "path";
import { fileURLToPath } from "url";
import { enqueueOrder } from "./producer.js";
import { registerSocket, unregisterSocket, sendStatus, } from "./websocketManager.js";
import { db } from "./db.js";
// Proper dirname resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// ============================================
// STATIC DIRECTORY SETUP (LOCAL + PRODUCTION)
// ============================================
const staticDir = process.env.NODE_ENV === "production"
    ? path.join(process.cwd(), "dist/public")
    : path.join(process.cwd(), "public");
// ============================================
// FACTORY FUNCTION
// ============================================
export async function buildServer() {
    const fastify = Fastify({ logger: false });
    await fastify.register(websocket);
    // Serve static files
    fastify.register(fastifyStatic, {
        root: staticDir,
        prefix: "/",
    });
    // Serve homepage → loads client.html
    fastify.get("/", (req, reply) => {
        reply.sendFile("client.html");
    });
    // ============================================
    // ORDER EXECUTION ROUTE
    // ============================================
    fastify.post("/api/orders/execute", async (req, reply) => {
        const order = await enqueueOrder(req.body);
        return reply.send({
            status: "queued",
            orderId: order.id,
            ws_url: `/api/orders/upgrade/${order.id}`,
        });
    });
    // ============================================
    // WebSocket Upgrade Route
    // ============================================
    fastify.get("/api/orders/upgrade/:orderId", { websocket: true }, (connection, req) => {
        const { orderId } = req.params;
        if (!orderId)
            return connection.socket.close();
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
                    txHash: r.tx_hash,
                    executedPrice: r.executed_price,
                    lastError: r.last_error,
                    attempts: r.attempts,
                    updatedAt: r.updated_at,
                };
            }
            const content = JSON.stringify(payload);
            if (content !== lastSent) {
                lastSent = content;
                sendStatus(orderId, payload);
            }
        };
        void pollAndSend();
        const interval = setInterval(async () => {
            if (!stopped) {
                await pollAndSend();
                if (lastSent &&
                    ["confirmed", "failed", "slippage_failed"].includes(JSON.parse(lastSent).status)) {
                    clearInterval(interval);
                }
            }
        }, 400);
    });
    return fastify;
}
// Boot server if running directly
const server = await buildServer();
export default server;
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    server
        .listen({ port: 3000, host: "0.0.0.0" })
        .then(() => console.log("Server running on port 3000"))
        .catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

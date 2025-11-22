// src/server.ts
import Fastify from "fastify";
import websocket from "@fastify/websocket";
import fastifyStatic from "@fastify/static";
import { join } from "path";

import { enqueueOrder } from "./producer.js";
import { registerSocket, unregisterSocket } from "./websocketManager.js";

interface CreateOrderPayload {
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  minAmountOut?: number;
  type?: string;
}

interface WSParams {
  orderId: string;
}

const fastify = Fastify({ logger: true });

//
// REGISTER WEBSOCKET FIRST  (MANDATORY for Fastify v4)
//
await fastify.register(websocket);

//
// SERVE STATIC FILES  (client.html)
//
await fastify.register(fastifyStatic, {
  root: join(process.cwd(), "public"),
  prefix: "/",
});

//
// REST API — submit order
//
fastify.post<{ Body: CreateOrderPayload }>("/orders", async (req, reply) => {
  const order = await enqueueOrder(req.body);
  return reply.send({ status: "queued", orderId: order.id });
});

//
// WEBSOCKET ROUTE (correct handler signature for Fastify v4)
//
fastify.get<{ Params: WSParams }>(
  "/ws/:orderId",
  { websocket: true },
  (connection, req) => {
    // Ensure this is a WS upgrade, not a normal HTTP request
    if (!req.headers.upgrade || req.headers.upgrade.toLowerCase() !== "websocket") {
      connection.socket.close();
      return;
    }

    const { orderId } = req.params;
    registerSocket(orderId, connection.socket);

    connection.socket.on("close", () => {
      unregisterSocket(orderId);
    });
  }
);


//
// START SERVER
//
await fastify.listen({ port: 3000, host: "0.0.0.0" });
console.log("Server running on port 3000");

// src/server.ts
import Fastify from "fastify";
import websocket from "@fastify/websocket";
import { WebSocket } from "ws";
import { enqueueOrder } from "./producer.js";
import { registerSocket, unregisterSocket } from "./websocketManager.js";
// import "dotenv/config";

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

await fastify.register(websocket);

// Submit order
fastify.post<{ Body: CreateOrderPayload }>("/orders", async (req, reply) => {
  const order = await enqueueOrder(req.body);
  return reply.send({ status: "queued", orderId: order.id });
});

// WebSocket connection
fastify.get<{ Params: WSParams }>(
  "/ws/:orderId",
  { websocket: true },
  (socket: WebSocket, req) => {
    const { orderId } = req.params;

    registerSocket(orderId, socket);

    socket.on("close", () => unregisterSocket(orderId));
  }
);

// Start server
fastify.listen({ port: 3000, host: "0.0.0.0" }).then(() => {
  console.log("Server running on port 3000");
});
